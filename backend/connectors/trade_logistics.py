# MALINDRA PHASE 4
# backend/connectors/trade_logistics.py
# Trade & logistics connector: UN Comtrade, AIS vessel tracking (public feeds).
# Implements: fetch(), validate(), cache_to_json()

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)

ROOT = Path(__file__).parent.parent.parent
CACHE_DIR = ROOT / "data" / "external" / "trade"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

TIMEOUT = 15

# UN Comtrade public API (no auth, rate-limited)
COMTRADE_BASE = "https://comtradeapi.un.org/public/v1/preview/C/A/HS"
# MarineTraffic public vessel feed (illustrative — real use requires API key)
AIS_BASE = "https://www.marinetraffic.com/api/exportvessel/v:8"

# Sri Lanka trade partner codes (UN M49)
LKA_CODE = "144"
PARTNER_CODES = {
    "china": "156",
    "india": "356",
    "usa": "840",
    "uae": "784",
    "singapore": "702",
}

# HS codes of interest
HS_CODES = {
    "tea": "0902",
    "garments": "6109",
    "rubber": "4001",
    "petroleum": "2710",
}


class TradeLogisticsConnector:
    """Connector for UN Comtrade and AIS vessel data."""

    SOURCE_ID = "trade_logistics"

    def fetch(self, url: str, cache_key: str, headers: dict[str, str] | None = None) -> dict[str, Any] | None:
        cache_path = CACHE_DIR / f"{cache_key}.json"
        try:
            req = Request(url, headers={
                "User-Agent": "Malindra/4.0 research-bot",
                **(headers or {}),
            })
            with urlopen(req, timeout=TIMEOUT) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw)
                cache_path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
                logger.info(f"[trade_logistics] Fetched {cache_key}")
                return data
        except (URLError, TimeoutError, json.JSONDecodeError) as e:
            logger.warning(f"[trade_logistics] Fetch failed {cache_key}: {e} — using cache")
            return self._load_cache(cache_path)

    def _load_cache(self, cache_path: Path) -> dict[str, Any] | None:
        if cache_path.exists():
            try:
                return json.loads(cache_path.read_text(encoding="utf-8"))
            except Exception:
                pass
        return None

    def validate(self, data: dict[str, Any] | None, required_keys: list[str]) -> bool:
        if data is None:
            return False
        return all(k in data for k in required_keys)

    def cache_to_json(self, data: dict[str, Any], cache_key: str) -> Path:
        out = {
            "source": self.SOURCE_ID,
            "cache_key": cache_key,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "data": data,
        }
        path = CACHE_DIR / f"{cache_key}_enriched.json"
        path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
        return path

    def fetch_lka_trade_preview(self, hs_code: str) -> dict[str, Any] | None:
        """Fetch Sri Lanka trade data for a given HS code from Comtrade preview API."""
        url = f"{COMTRADE_BASE}/{hs_code}?reporterCode={LKA_CODE}&period=2023&partnerCode=0&motCode=0"
        cache_key = f"comtrade_lka_{hs_code}"
        data = self.fetch(url, cache_key)
        if data:
            self.cache_to_json(data, cache_key)
        return data

    def sync_all(self) -> dict[str, Any]:
        """Sync all trade endpoints. Returns status report."""
        results: dict[str, Any] = {
            "source": self.SOURCE_ID,
            "synced_at": datetime.now(timezone.utc).isoformat(),
            "endpoints": {},
        }

        for product, hs_code in HS_CODES.items():
            data = self.fetch_lka_trade_preview(hs_code)
            cache_key = f"comtrade_lka_{hs_code}"
            results["endpoints"][f"comtrade_{product}"] = {
                "ok": data is not None,
                "hs_code": hs_code,
                "cached": (CACHE_DIR / f"{cache_key}.json").exists(),
            }

        return results
