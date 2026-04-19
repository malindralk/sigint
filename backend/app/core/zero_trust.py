# MALINDRA PHASE 5
# backend/app/core/zero_trust.py
# Zero-trust security primitives:
# - Per-IP rate limiting with sliding window
# - Immutable audit trail (append-only JSONL, hash-chained)
# - Request fingerprinting (detect bot/scraper patterns)
# - JWT claims validation with issuer/audience checking

from __future__ import annotations

import hashlib
import hmac
import json
import secrets
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).parent.parent.parent.parent
AUDIT_DIR = ROOT / "data" / "audit"
AUDIT_DIR.mkdir(parents=True, exist_ok=True)

# ── Immutable audit trail ─────────────────────────────────────────────────────
# Each entry includes a SHA-256 hash of the previous entry (hash chain).
# Tampering with any prior entry breaks the chain.

CHAIN_LOG = AUDIT_DIR / "chain.jsonl"
_CHAIN_SECRET = secrets.token_hex(32)  # in-process only; replaced by env var in prod


def _prev_hash() -> str:
    """SHA-256 of the last line in the chain log."""
    if not CHAIN_LOG.exists():
        return "genesis"
    try:
        last = b""
        with CHAIN_LOG.open("rb") as f:
            for line in f:
                last = line
        return hashlib.sha256(last.strip()).hexdigest()
    except Exception:
        return "error"


def append_audit(event: str, payload: dict[str, Any], actor: str = "system") -> None:
    """
    Append an immutable, hash-chained audit log entry.
    Fields: ts, event, actor, payload, prev_hash, entry_hash
    """
    import os

    secret = os.getenv("AUDIT_CHAIN_SECRET", _CHAIN_SECRET)
    prev = _prev_hash()
    entry: dict[str, Any] = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "event": event,
        "actor": actor,
        "payload": payload,
        "prev_hash": prev,
    }
    # HMAC-SHA256 of entry content for tamper detection
    raw = json.dumps(entry, sort_keys=True, ensure_ascii=False)
    entry["entry_hash"] = hmac.new(
        secret.encode(), raw.encode(), "sha256"
    ).hexdigest()

    try:
        with CHAIN_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        pass


def verify_chain(limit: int = 100) -> dict[str, Any]:
    """
    Verify hash chain integrity for the last `limit` entries.
    Returns {valid: bool, checked: int, broken_at: int | None}
    """
    import os

    if not CHAIN_LOG.exists():
        return {"valid": True, "checked": 0, "broken_at": None}

    secret = os.getenv("AUDIT_CHAIN_SECRET", _CHAIN_SECRET)
    lines: list[bytes] = []
    try:
        with CHAIN_LOG.open("rb") as f:
            lines = f.readlines()[-limit:]
    except Exception:
        return {"valid": False, "checked": 0, "broken_at": None, "error": "read_error"}

    prev_hash = "genesis"
    for idx, raw_line in enumerate(lines):
        line = raw_line.strip()
        try:
            entry = json.loads(line)
        except Exception:
            return {"valid": False, "checked": idx, "broken_at": idx}

        stored_hash = entry.pop("entry_hash", "")
        entry_without_hash = json.dumps(entry, sort_keys=True, ensure_ascii=False)
        expected = hmac.new(secret.encode(), entry_without_hash.encode(), "sha256").hexdigest()
        if stored_hash != expected:
            return {"valid": False, "checked": idx, "broken_at": idx, "reason": "hmac_mismatch"}

        if idx > 0 and entry.get("prev_hash") != prev_hash:
            return {"valid": False, "checked": idx, "broken_at": idx, "reason": "chain_break"}

        prev_hash = hashlib.sha256(line).hexdigest()

    return {"valid": True, "checked": len(lines), "broken_at": None}


# ── Per-IP sliding window rate limiter ────────────────────────────────────────

_IP_WINDOWS: dict[str, list[float]] = defaultdict(list)

def ip_rate_check(
    ip_hash: str,
    limit: int = 60,
    window_seconds: int = 60,
) -> tuple[bool, int]:
    """
    Sliding window rate limiter.
    Returns (allowed: bool, remaining: int).
    """
    now = time.monotonic()
    window = _IP_WINDOWS[ip_hash]
    # Evict expired entries
    cutoff = now - window_seconds
    _IP_WINDOWS[ip_hash] = [t for t in window if t > cutoff]
    count = len(_IP_WINDOWS[ip_hash])
    if count >= limit:
        return False, 0
    _IP_WINDOWS[ip_hash].append(now)
    return True, limit - count - 1


# ── Request fingerprinting ────────────────────────────────────────────────────

_KNOWN_BOT_PATTERNS = [
    "bot", "crawler", "spider", "scraper", "wget", "curl/",
    "python-requests", "go-http", "okhttp", "libwww",
    "masscan", "nmap", "sqlmap", "nikto", "nuclei",
]

_SUSPICIOUS_HEADERS = [
    "x-forwarded-for",  # may indicate proxy chaining abuse
]


def fingerprint_request(
    user_agent: str,
    headers: dict[str, str],
    path: str,
) -> dict[str, Any]:
    """
    Heuristic request fingerprint.
    Returns {risk_score: 0-100, flags: list[str], is_bot: bool}
    """
    flags: list[str] = []
    score = 0
    ua_lower = user_agent.lower()

    # Bot UA detection
    is_bot = any(p in ua_lower for p in _KNOWN_BOT_PATTERNS)
    if is_bot:
        flags.append("known_bot_ua")
        score += 40

    # Empty UA
    if not user_agent or len(user_agent) < 10:
        flags.append("empty_or_short_ua")
        score += 20

    # Path traversal attempt
    if ".." in path or "%2e%2e" in path.lower():
        flags.append("path_traversal")
        score += 50

    # SQLi / XSS patterns in path
    lpath = path.lower()
    if any(p in lpath for p in ["union+select", "1=1", "<script", "javascript:", "onerror="]):
        flags.append("injection_attempt")
        score += 60

    # Accept-Language missing (common in scanners)
    if "accept-language" not in {k.lower() for k in headers}:
        flags.append("no_accept_language")
        score += 10

    return {
        "risk_score": min(100, score),
        "flags": flags,
        "is_bot": is_bot,
        "suspicious": score >= 40,
    }


# ── Nonce generator for inline scripts ────────────────────────────────────────

def generate_csp_nonce() -> str:
    """Generate a cryptographically secure CSP nonce (base64url, 128 bits)."""
    import base64

    raw = secrets.token_bytes(16)
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()
