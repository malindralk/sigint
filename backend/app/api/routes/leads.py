"""
FastAPI leads capture & CRM routing.
MALINDRA PHASE 3

POST /api/leads/capture   — capture lead, route to Resend + HubSpot
GET  /api/leads/export    — CSV export for editorial team (auth-protected)
"""

import csv
import io
import json
import logging
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

from app.api.deps import DBSession
from app.core.config import get_settings
from app.core.security import verify_access_token as verify_token

router = APIRouter(prefix="/leads", tags=["leads"])
logger = logging.getLogger(__name__)
settings = get_settings()

LEADS_FILE = Path("data/leads/leads.json")
LEADS_FILE.parent.mkdir(parents=True, exist_ok=True)

VALID_ROLES = frozenset([
    "analyst", "journalist", "researcher", "policymaker",
    "investor", "student", "other",
])
VALID_TOPICS = frozenset(["debt", "digital", "tourism", "geopolitics", "energy"])

# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_leads() -> list[dict]:
    if LEADS_FILE.exists():
        try:
            return json.loads(LEADS_FILE.read_text())
        except Exception:
            pass
    return []


def _save_leads(leads: list[dict]) -> None:
    LEADS_FILE.write_text(json.dumps(leads, indent=2, default=str))


def _sanitize(text: str, max_len: int = 200) -> str:
    return re.sub(r'<[^>]+>', '', text).strip()[:max_len]

# ── Models ────────────────────────────────────────────────────────────────────

class LeadCaptureRequest(BaseModel):
    name: str
    email: str
    organization: Optional[str] = None
    role: Optional[str] = "other"
    topics: Optional[list[str]] = []
    locale: Optional[str] = "en"
    consent: bool

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        pattern = r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, v) or len(v) > 254:
            raise ValueError("Invalid email address")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = _sanitize(v, 120)
        if len(v) < 1:
            raise ValueError("Name is required")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in VALID_ROLES:
            return "other"
        return v

    @field_validator("topics")
    @classmethod
    def validate_topics(cls, v: Optional[list[str]]) -> list[str]:
        if not v:
            return []
        return [t.lower().strip() for t in v if t.lower().strip() in VALID_TOPICS]

    @field_validator("consent")
    @classmethod
    def validate_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Consent is required")
        return v


class LeadCaptureResponse(BaseModel):
    status: str
    lead_id: str
    consent_timestamp: str
    message: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/capture", response_model=LeadCaptureResponse)
async def capture_lead(body: LeadCaptureRequest) -> LeadCaptureResponse:
    lead_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    lead = {
        "id": lead_id,
        "name": body.name,
        "email": body.email,
        "organization": _sanitize(body.organization or "", 200),
        "role": body.role,
        "topics": body.topics,
        "locale": body.locale,
        "consent": body.consent,
        "consentTimestamp": now,
        "createdAt": now,
        "resendSynced": False,
        "hubspotSynced": False,
    }

    # Persist to file
    leads = _load_leads()
    leads.append(lead)
    _save_leads(leads)

    # Forward to Resend (non-blocking, best-effort)
    resend_key = getattr(settings, "resend_api_key", "") or ""
    if resend_key:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=8) as client:
                await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {resend_key}"},
                    json={
                        "from": getattr(settings, "smtp_from", "noreply@malindra.lk"),
                        "to": body.email,
                        "subject": "Welcome to Malindra Intelligence Dispatch",
                        "html": _build_welcome_email(body.name, body.topics, body.locale or "en"),
                    },
                )
            lead["resendSynced"] = True
        except Exception as e:
            logger.warning("Resend sync failed for lead %s: %s", lead_id, e)

    # Forward to HubSpot (non-blocking, best-effort)
    hubspot_key = getattr(settings, "hubspot_api_key", "") or ""
    if hubspot_key:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=8) as client:
                await client.post(
                    "https://api.hubapi.com/crm/v3/objects/contacts",
                    headers={"Authorization": f"Bearer {hubspot_key}"},
                    json={
                        "properties": {
                            "email": body.email,
                            "firstname": body.name.split()[0] if body.name else "",
                            "lastname": " ".join(body.name.split()[1:]) if body.name else "",
                            "company": body.organization or "",
                            "jobtitle": body.role or "",
                            "hs_lead_status": "NEW",
                        }
                    },
                )
            lead["hubspotSynced"] = True
        except Exception as e:
            logger.warning("HubSpot sync failed for lead %s: %s", lead_id, e)

    # Update persisted lead with sync status
    for l in leads:
        if l["id"] == lead_id:
            l.update({"resendSynced": lead["resendSynced"], "hubspotSynced": lead["hubspotSynced"]})
    _save_leads(leads)

    logger.info("Lead captured: %s <%s> topics=%s", body.name, body.email, body.topics)

    return LeadCaptureResponse(
        status="captured",
        lead_id=lead_id,
        consent_timestamp=now,
        message="Your intelligence subscription is confirmed.",
    )


@router.get("/export")
async def export_leads(token: str = "") -> StreamingResponse:
    """
    CSV export — requires valid admin token in ?token= query param.
    In production, replace with proper auth dependency.
    """
    # Basic token check — replace with proper JWT auth in production
    if not token or token != getattr(settings, "export_token", ""):
        raise HTTPException(status_code=401, detail="Unauthorized")

    leads = _load_leads()
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "id", "name", "email", "organization", "role", "topics",
        "locale", "consent", "consentTimestamp", "createdAt",
        "resendSynced", "hubspotSynced",
    ])
    writer.writeheader()
    for lead in leads:
        row = dict(lead)
        if isinstance(row.get("topics"), list):
            row["topics"] = ",".join(row["topics"])
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="malindra-leads.csv"'},
    )


def _build_welcome_email(name: str, topics: list[str], locale: str) -> str:
    topic_str = ", ".join(t.title() for t in topics) if topics else "All Topics"
    if locale == "si":
        return f"""<p>ආයුබෝවන් {name},</p>
<p>Malindra Intelligence Dispatch හට ස්තූතිය. ඔබ ලියාපදිංචි කළ මාතෘකා: <strong>{topic_str}</strong></p>
<p><em>මලින්ද්‍ර · Kotte Kingdom 1412–1467 CE</em></p>"""
    return f"""<p>Welcome, {name},</p>
<p>You're now subscribed to the Malindra Intelligence Dispatch. Your topics: <strong>{topic_str}</strong></p>
<p>Data-driven socio-economic and geopolitical analysis for Sri Lanka and the Indian Ocean region.</p>
<p><em>Malindra · Kotte Kingdom 1412–1467 CE</em></p>"""
