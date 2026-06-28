from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "operation-child-shield-api",
        "congress": settings.congress_number,
        "api_key_configured": bool(settings.congress_api_key),
    }