from fastapi import APIRouter

from ..config import settings

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "provider": settings.ai_provider,
        "service": "ai-service",
        "mock_mode": settings.ai_provider == "mock",
    }
