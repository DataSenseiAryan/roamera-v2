from fastapi import APIRouter

from ..config import settings

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "provider": settings.ai_provider,
        "service": "ai-service",
    }
