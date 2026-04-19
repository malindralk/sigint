"""
Newsletter subscription endpoint.
MALINDRA PHASE 2

Validates email, accepts topic segmentation, sanitizes, and forwards to
configured email provider. Designed for static-compatible POSTs from
Next.js frontend.
"""

import re
from email.utils import parseaddr
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

router = APIRouter(prefix="/newsletter", tags=["newsletter"])

VALID_TOPICS = frozenset(["debt", "digital", "tourism", "geopolitics", "energy"])


class SubscribeRequest(BaseModel):
    email: str
    topics: Optional[list[str]] = []

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        # Basic RFC-5322 subset validation
        pattern = r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, v):
            raise ValueError("Invalid email address")
        _, addr = parseaddr(v)
        if addr != v:
            raise ValueError("Invalid email format")
        if len(v) > 254:
            raise ValueError("Email address too long")
        return v

    @field_validator("topics")
    @classmethod
    def validate_topics(cls, v: list[str]) -> list[str]:
        if v is None:
            return []
        sanitized = [t.lower().strip() for t in v if isinstance(t, str)]
        invalid = [t for t in sanitized if t not in VALID_TOPICS]
        if invalid:
            raise ValueError(f"Invalid topics: {invalid}")
        return sanitized


class SubscribeResponse(BaseModel):
    status: str
    message: str
    topics: list[str]


@router.post("/subscribe", response_model=SubscribeResponse)
async def subscribe(request: SubscribeRequest) -> SubscribeResponse:
    """
    Subscribe an email to the Malindra newsletter with optional topic segmentation.

    Payload: { email: string, topics: string[] }
    Valid topics: debt, digital, tourism, geopolitics, energy

    Currently stores to log; wire to Resend/Mailchimp in production
    by reading settings.smtp_host / a RESEND_API_KEY env var.
    """
    import logging
    logger = logging.getLogger(__name__)

    # TODO: Forward to Resend API or Mailchimp with audience segmentation
    # Example Resend integration:
    #   import httpx
    #   settings = get_settings()
    #   async with httpx.AsyncClient() as client:
    #       await client.post(
    #           "https://api.resend.com/audiences/{audience_id}/contacts",
    #           headers={"Authorization": f"Bearer {settings.resend_api_key}"},
    #           json={
    #               "email": request.email,
    #               "unsubscribed": False,
    #               "data": {"topics": request.topics},
    #           },
    #       )

    topics = request.topics or []
    logger.info("Newsletter subscription: %s, topics: %s", request.email, topics)

    return SubscribeResponse(
        status="success",
        message="Subscription recorded. The signal will reach you.",
        topics=topics,
    )
