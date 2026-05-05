"""AI caption + hashtag endpoints — implemented in Sprint 3."""
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..middleware.hmac import verify_service_token

router = APIRouter(prefix="/v1/ai", tags=["ai"])


class CaptionRequest(BaseModel):
    image_url: str
    context: Optional[Dict] = None


class HashtagsRequest(BaseModel):
    post_content: str
    destination: Optional[str] = None
    vacation_type: Optional[str] = None


class TranslateRequest(BaseModel):
    text: str
    target_locale: str


@router.post("/caption", dependencies=[Depends(verify_service_token)])
async def generate_caption(body: CaptionRequest) -> dict:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="AI caption endpoint not yet implemented — see Sprint 3.",
    )


@router.post("/hashtags", dependencies=[Depends(verify_service_token)])
async def generate_hashtags(body: HashtagsRequest) -> dict:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="AI hashtags endpoint not yet implemented — see Sprint 3.",
    )


@router.post("/translate", dependencies=[Depends(verify_service_token)])
async def translate_text(body: TranslateRequest) -> dict:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="AI translate endpoint not yet implemented — see Sprint 10.",
    )
