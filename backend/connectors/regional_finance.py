# MALINDRA PHASE 4
# backend/connectors/regional_finance.py
# Regional finance data connector: CBSL, RBI, MAS APIs.
# Implements: fetch(), validate(), cache_to_json()
# Falls back to cached data if network unavailable.

import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)

ROOT = Path(__file__).parent.parent.parent
CACHE_DIR = ROOT / "data" / "external" / "cbsl"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Public data endpoints (no auth required)
CBSL_ENDPOINTS = {
    "exchange_rates": "https://www.cbsl.gov.lk/sites/default/files/cbslweb_documents/statistics/exchrate/latest.json",
    "interest_rates": "https://www.cbsl.gov.lk/api/interest-rates",  # illustrative
}

RBI_ENDPOINTS = {
    "policy_rate": "https://www.rbi.org.in/commonman/English/scripts/PublicationsView.aspx?id=20566",  # illustrative
}

MAS_ENDPOINTS = {
    "sgd_rate": "https://eservices.mas.gov.sg/api/action/datastore/search.json?resource_id=95932927-c8bc-4e7a-b484-68a66a24edfe&limit=1",
}

TIMEOUT = 10  # seconds


class RegionalFinanceConnector:
    """Connector for CBSL, RBI, MAS regional finance data."""

    SOURCE_ID = "regional_finance"

    def fetch(self, endpoint_url: str, cache_key: str) -> dict[str, Any] | None:
        """Fetch JSON from endpoint with timeout. Returns None on failure."""
        cache_path = CACHE_DIR / f"{cache_key}.json"
        try:
            req = Request(endpoint_url, headers={"User-Agent": "Malindra/4.0 research-bot"})
            with urlopen(req, timeout=TIMEOUT) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw)
                # Update cache on successful fetch
                cache_path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
                logger.info(f"[regional_finance] Fetched {cache_key} from {endpoint_url}")
                return data
        except (URLError, TimeoutError, json.JSONDecodeError) as e:
            logger.warning(f"[regional_finance] Fetch failed for {cache_key}: {e} — using cache")
            return self._load_cache(cache_path)

    def _load_cache(self, cache_path: Path) -> dict[str, Any] | None:
        if cache_path.exists():
            try:
                return json.loads(cache_path.read_text(encoding="utf-8"))
            except Exception:
                pass
        return None

    def validate(self, data: dict[str, Any] | None, required_keys: list[str]) -> bool:
        """Validate that data is non-null and contains required keys."""
        if data is None:
            return False
        return all(k in data for k in required_keys)

    def cache_to_json(self, data: dict[str, Any], cache_key: str) -> Path:
        """Write data to cache file and return path."""
        out = {
            "source": self.SOURCE_ID,
            "cache_key": cache_key,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "data": data,
        }
        path = CACHE_DIR / f"{cache_key}_enriched.json"
        path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
        return path

    def sync_all(self) -> dict[str, Any]:
        """Sync all regional finance endpoints. Returns status report."""
        results: dict[str, Any] = {
            "source": self.SOURCE_ID,
            "synced_at": datetime.now(timezone.utc).isoformat(),
            "endpoints": {},
        }

        # CBSL exchange rates
        cbsl_data = self.fetch(CBSL_ENDPOINTS["exchange_rates"], "cbsl_exchange_rates")
        results["endpoints"]["cbsl_exchange_rates"] = {
            "ok": cbsl_data is not None,
            "cached": (CACHE_DIR / "cbsl_exchange_rates.json").exists(),
        }
        if cbsl_data:
            self.cache_to_json(cbsl_data, "cbsl_exchange_rates")

        # MAS SGD rate
        mas_data = self.fetch(MAS_ENDPOINTS["sgd_rate"], "mas_sgd_rate")
        results["endpoints"]["mas_sgd_rate"] = {
            "ok": mas_data is not None,
            "cached": (CACHE_DIR / "mas_sgd_rate.json").exists(),
        }
        if mas_data:
            self.cache_to_json(mas_data, "mas_sgd_rate")

        return results
