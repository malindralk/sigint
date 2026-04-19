# MALINDRA PHASE 5
# backend/connectors/multilateral.py
# Multilateral data pipeline: IMF, World Bank, ASEAN, UN Comtrade, ILO
# Each connector: fetch(), validate_schema(), cache_to_json(), handle_rate_limit()
# Falls back to last-known cached snapshot on network failure.

import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)

ROOT = Path(__file__).parent.parent.parent
CACHE_ROOT = ROOT / "data" / "external"
CACHE_ROOT.mkdir(parents=True, exist_ok=True)

TIMEOUT = 15
MAX_RETRIES = 2
RETRY_BACKOFF = 2.0  # seconds


# ── Base connector ────────────────────────────────────────────────────────────

class BaseConnector:
    SOURCE_ID: str = "base"
    CACHE_SUBDIR: str = "base"

    def __init__(self):
        self.cache_dir = CACHE_ROOT / self.CACHE_SUBDIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _cache_path(self, key: str) -> Path:
        return self.cache_dir / f"{key}.json"

    def fetch(self, url: str, cache_key: str, headers: dict | None = None) -> dict | list | None:
        cache_path = self._cache_path(cache_key)
        last_err = None
        for attempt in range(MAX_RETRIES + 1):
            if attempt > 0:
                time.sleep(RETRY_BACKOFF * attempt)
            try:
                req = Request(url, headers={
                    "User-Agent": "Malindra/5.0 research-bot",
                    "Accept": "application/json",
                    **(headers or {}),
                })
                with urlopen(req, timeout=TIMEOUT) as resp:
                    raw = resp.read().decode("utf-8")
                    data = json.loads(raw)
                    cache_path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
                    return data
            except HTTPError as e:
                if e.code == 429:
                    logger.warning(f"[{self.SOURCE_ID}] Rate limited on {cache_key} — waiting {RETRY_BACKOFF * 2}s")
                    time.sleep(RETRY_BACKOFF * 2)
                last_err = e
            except (URLError, TimeoutError, json.JSONDecodeError) as e:
                last_err = e

        logger.warning(f"[{self.SOURCE_ID}] Fetch failed for {cache_key}: {last_err} — using cache")
        return self._load_cache(cache_path)

    def _load_cache(self, cache_path: Path) -> dict | list | None:
        if cache_path.exists():
            try:
                return json.loads(cache_path.read_text(encoding="utf-8"))
            except Exception:
                pass
        return None

    def validate_schema(self, data: Any, required_keys: list[str]) -> bool:
        if data is None:
            return False
        if isinstance(data, list):
            return len(data) > 0
        return all(k in data for k in required_keys)

    def cache_to_json(self, data: Any, cache_key: str) -> Path:
        out = {
            "source": self.SOURCE_ID,
            "cache_key": cache_key,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "data": data,
        }
        path = self.cache_dir / f"{cache_key}_enriched.json"
        path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
        return path

    def handle_rate_limit(self, wait_seconds: float = 2.0) -> None:
        time.sleep(wait_seconds)

    def sync_all(self) -> dict[str, Any]:
        raise NotImplementedError


# ── IMF connector ─────────────────────────────────────────────────────────────

class IMFConnector(BaseConnector):
    SOURCE_ID = "imf"
    CACHE_SUBDIR = "imf"

    # IMF DataMapper public API (no auth required)
    BASE_URL = "https://www.imf.org/external/datamapper/api/v1"

    def fetch_gdp_growth(self, country_code: str = "LKA") -> dict | None:
        url = f"{self.BASE_URL}/NGDP_RPCH/{country_code}?periods=2020,2021,2022,2023,2024"
        data = self.fetch(url, f"imf_gdp_{country_code}")
        if data and self.validate_schema(data, ["values"]):
            self.cache_to_json(data, f"imf_gdp_{country_code}")
        return data

    def fetch_current_account(self, country_code: str = "LKA") -> dict | None:
        url = f"{self.BASE_URL}/BCA_NGDPD/{country_code}?periods=2020,2021,2022,2023,2024"
        data = self.fetch(url, f"imf_ca_{country_code}")
        if data:
            self.cache_to_json(data, f"imf_ca_{country_code}")
        return data

    def fetch_inflation(self, country_code: str = "LKA") -> dict | None:
        url = f"{self.BASE_URL}/PCPIPCH/{country_code}?periods=2020,2021,2022,2023,2024"
        data = self.fetch(url, f"imf_inflation_{country_code}")
        if data:
            self.cache_to_json(data, f"imf_inflation_{country_code}")
        return data

    def sync_all(self) -> dict[str, Any]:
        results: dict[str, Any] = {
            "source": self.SOURCE_ID,
            "synced_at": datetime.now(timezone.utc).isoformat(),
            "endpoints": {},
        }
        for fn_name, fn in [
            ("gdp_growth", self.fetch_gdp_growth),
            ("current_account", self.fetch_current_account),
            ("inflation", self.fetch_inflation),
        ]:
            data = fn()
            results["endpoints"][fn_name] = {"ok": data is not None}
            self.handle_rate_limit(1.0)
        return results


# ── World Bank connector ──────────────────────────────────────────────────────

class WorldBankConnector(BaseConnector):
    SOURCE_ID = "worldbank"
    CACHE_SUBDIR = "worldbank"

    BASE_URL = "https://api.worldbank.org/v2"

    def fetch_indicator(self, indicator: str, country: str = "LK", years: str = "2018:2024") -> dict | None:
        url = f"{self.BASE_URL}/country/{country}/indicator/{indicator}?format=json&date={years}&per_page=20"
        key = f"wb_{country}_{indicator.replace('.', '_')}"
        data = self.fetch(url, key)
        if data:
            self.cache_to_json(data, key)
        return data

    def sync_all(self) -> dict[str, Any]:
        results: dict[str, Any] = {
            "source": self.SOURCE_ID,
            "synced_at": datetime.now(timezone.utc).isoformat(),
            "endpoints": {},
        }
        indicators = {
            "gdp_per_capita": "NY.GDP.PCAP.CD",
            "poverty_rate": "SI.POV.NAHC",
            "trade_pct_gdp": "NE.TRD.GNFS.ZS",
            "fdi_inflows": "BX.KLT.DINV.CD.WD",
        }
        for name, code in indicators.items():
            data = self.fetch_indicator(code)
            results["endpoints"][name] = {"ok": data is not None, "indicator": code}
            self.handle_rate_limit(0.5)
        return results


# ── UN Comtrade connector (reuses trade_logistics but extended) ────────────────

class UNComtradeConnector(BaseConnector):
    SOURCE_ID = "uncomtrade"
    CACHE_SUBDIR = "uncomtrade"

    BASE_URL = "https://comtradeapi.un.org/public/v1/preview/C/A/HS"
    LKA_CODE = "144"

    HS_CODES = {"tea": "0902", "garments": "6109", "rubber": "4001"}

    def fetch_trade_flow(self, hs_code: str) -> dict | None:
        url = f"{self.BASE_URL}/{hs_code}?reporterCode={self.LKA_CODE}&period=2023&partnerCode=0&motCode=0"
        key = f"comtrade_lka_{hs_code}"
        data = self.fetch(url, key)
        if data:
            self.cache_to_json(data, key)
        return data

    def sync_all(self) -> dict[str, Any]:
        results: dict[str, Any] = {
            "source": self.SOURCE_ID,
            "synced_at": datetime.now(timezone.utc).isoformat(),
            "endpoints": {},
        }
        for product, hs_code in self.HS_CODES.items():
            data = self.fetch_trade_flow(hs_code)
            results["endpoints"][f"trade_{product}"] = {"ok": data is not None, "hs_code": hs_code}
            self.handle_rate_limit(1.5)
        return results


# ── ILO connector ─────────────────────────────────────────────────────────────

class ILOConnector(BaseConnector):
    SOURCE_ID = "ilo"
    CACHE_SUBDIR = "ilo"

    # ILO ILOSTAT API (public)
    BASE_URL = "https://rplumber.ilo.org/data/indicator"

    def fetch_unemployment(self, country: str = "LKA") -> dict | None:
        url = f"{self.BASE_URL}/?id=UNE_TUNE_SEX_AGE_NB_A&ref_area={country}&sex=SEX_T&classif1=AGE_YTHADULT_YGE15&timefrom=2018&format=jsonstat"
        key = f"ilo_unemployment_{country}"
        data = self.fetch(url, key)
        if data:
            self.cache_to_json(data, key)
        return data

    def fetch_labor_participation(self, country: str = "LKA") -> dict | None:
        url = f"{self.BASE_URL}/?id=EAP_TEAP_SEX_AGE_RT_A&ref_area={country}&sex=SEX_T&classif1=AGE_YTHADULT_YGE15&timefrom=2018&format=jsonstat"
        key = f"ilo_participation_{country}"
        data = self.fetch(url, key)
        if data:
            self.cache_to_json(data, key)
        return data

    def sync_all(self) -> dict[str, Any]:
        results: dict[str, Any] = {
            "source": self.SOURCE_ID,
            "synced_at": datetime.now(timezone.utc).isoformat(),
            "endpoints": {},
        }
        for name, fn in [("unemployment", self.fetch_unemployment), ("labor_participation", self.fetch_labor_participation)]:
            data = fn()
            results["endpoints"][name] = {"ok": data is not None}
            self.handle_rate_limit(1.0)
        return results


# ── ASEAN connector ───────────────────────────────────────────────────────────

class ASEANConnector(BaseConnector):
    SOURCE_ID = "asean"
    CACHE_SUBDIR = "asean"

    # ASEAN Stats public data portal
    BASE_URL = "https://data.aseanstats.org/api/indicator"

    def fetch_trade_stats(self) -> dict | None:
        # ASEAN-LK trade data (public endpoint)
        url = f"{self.BASE_URL}/trade/by-country?reporter=LKA&format=json"
        data = self.fetch(url, "asean_trade_lka")
        if data:
            self.cache_to_json(data, "asean_trade_lka")
        return data

    def sync_all(self) -> dict[str, Any]:
        results: dict[str, Any] = {
            "source": self.SOURCE_ID,
            "synced_at": datetime.now(timezone.utc).isoformat(),
            "endpoints": {},
        }
        data = self.fetch_trade_stats()
        results["endpoints"]["asean_trade"] = {"ok": data is not None}
        return results


# ── Sync-all orchestrator ─────────────────────────────────────────────────────

def sync_all_multilateral() -> dict[str, Any]:
    """Run all multilateral connectors, return status report."""
    connectors = [
        IMFConnector(),
        WorldBankConnector(),
        UNComtradeConnector(),
        ILOConnector(),
        ASEANConnector(),
    ]
    report: dict[str, Any] = {
        "synced_at": datetime.now(timezone.utc).isoformat(),
        "connectors": {},
    }
    for conn in connectors:
        try:
            result = conn.sync_all()
            report["connectors"][conn.SOURCE_ID] = {"status": "ok", "result": result}
        except Exception as e:
            logger.exception(f"Connector failed: {conn.SOURCE_ID}")
            report["connectors"][conn.SOURCE_ID] = {"status": "error", "error": str(e)}
    return report
