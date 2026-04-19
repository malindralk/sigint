"""Routes package initialization."""
# MALINDRA PHASE 5

from fastapi import APIRouter

from app.api.routes import (
    admin,
    analytics,
    articles,
    auth,
    consent,
    editorial,
    engagement,
    enrichment,
    export,
    leads,
    newsletter,
    search,
    social,
    # Phase 4
    ai,
    connectors,
    enterprise,
    compliance,
    monitoring,
    # Phase 5
    subscriptions,
    telemetry,
    partners,
)

api_router = APIRouter()
api_router.include_router(articles.router)
api_router.include_router(search.router)
api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(export.router)
api_router.include_router(newsletter.router)
api_router.include_router(enrichment.router)
# Phase 3
api_router.include_router(social.router)
api_router.include_router(engagement.router)
api_router.include_router(leads.router)
api_router.include_router(editorial.router)
api_router.include_router(analytics.router)
api_router.include_router(consent.router)
# Phase 4
api_router.include_router(ai.router)
api_router.include_router(connectors.router)
api_router.include_router(enterprise.router)
api_router.include_router(compliance.router)
api_router.include_router(monitoring.router)
# Phase 5
api_router.include_router(subscriptions.router)
api_router.include_router(telemetry.router)
api_router.include_router(partners.router)

__all__ = ["api_router"]
