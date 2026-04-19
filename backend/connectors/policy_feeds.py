# MALINDRA PHASE 4
# backend/connectors/policy_feeds.py
# Policy publication connector: LKI, ORF, ADB RSS/JSON feeds.
# Implements: fetch(), validate(), cache_to_json()

import json
import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)

ROOT = Path(__file__).parent.parent.parent
CACHE_DIR = ROOT / "data" / "external" / "lki"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

TIMEOUT = 12

POLICY_FEEDS = {
    "lki": "https://www.lki.lk/feed/",
    "orf": "https://www.orfonline.org/feed/",
    "adb_sri_lanka": "https://www.adb.org/rss/publications?field_topics_tid=All&field_countries_tid=141",
    "imf_sri_lanka": "https://www.imf.org/en/rss/?country=LK",
}


def _parse_rss(xml_bytes: bytes, source_id: str) -> list[dict[str, str]]:
    """Parse RSS XML to a list of article dicts."""
    items: list[dict[str, str]] = []
    try:
        root = ET.fromstring(xml_bytes)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        channel = root.find("channel")
        if channel is None:
            return items
        for item in channel.findall("item"):
            title_el = item.find("title")
            link_el = item.find("link")
            pub_el = item.find("pubDate")
            desc_el = item.find("description")
            items.append({
                "source": source_id,
                "title": (title_el.text or "").strip() if title_el is not None else "",
                "link": (link_el.text or "").strip() if link_el is not None else "",
                "pub_date": (pub_el.text or "").strip() if pub_el is not None else "",
                "description": (desc_el.text or "")[:400].strip() if desc_el is not None else "",
            })
    except ET.ParseError as e:
        logger.warning(f"[policy_feeds] RSS parse error for {source_id}: {e}")
    return items


class PolicyFeedsConnector:
    """Connector for LKI, ORF, ADB, IMF policy publication feeds."""

    SOURCE_ID = "policy_feeds"

    def fetch(self, url: str, cache_key: str) -> bytes | None:
        cache_path = CACHE_DIR / f"{cache_key}.xml"
        try:
            req = Request(url, headers={"User-Agent": "Malindra/4.0 research-bot"})
            with urlopen(req, timeout=TIMEOUT) as resp:
                raw = resp.read()
                cache_path.write_bytes(raw)
                logger.info(f"[policy_feeds] Fetched {cache_key}")
                return raw
        except (URLError, TimeoutError) as e:
            logger.warning(f"[policy_feeds] Fetch failed {cache_key}: {e} — using cache")
            if cache_path.exists():
                return cache_path.read_bytes()
            return None

    def validate(self, data: list[dict] | None, min_items: int = 0) -> bool:
        return data is not None and len(data) >= min_items

    def cache_to_json(self, items: list[dict[str, str]], cache_key: str) -> Path:
        out = {
            "source": self.SOURCE_ID,
            "cache_key": cache_key,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "count": len(items),
            "items": items,
        }
        path = CACHE_DIR / f"{cache_key}_enriched.json"
        path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
        return path

    def sync_all(self) -> dict[str, Any]:
        results: dict[str, Any] = {
            "source": self.SOURCE_ID,
            "synced_at": datetime.now(timezone.utc).isoformat(),
            "endpoints": {},
        }

        all_items: list[dict[str, str]] = []
        for source_id, url in POLICY_FEEDS.items():
            raw = self.fetch(url, source_id)
            items = _parse_rss(raw, source_id) if raw else []
            all_items.extend(items)
            self.cache_to_json(items, source_id)
            results["endpoints"][source_id] = {
                "ok": raw is not None,
                "items": len(items),
                "cached": (CACHE_DIR / f"{source_id}.xml").exists(),
            }

        # Write merged index
        merged_path = CACHE_DIR / "policy_feeds_merged.json"
        merged_path.write_text(
            json.dumps({
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "total": len(all_items),
                "items": all_items[:200],  # cap at 200 items
            }, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        results["merged_count"] = len(all_items)
        return results
