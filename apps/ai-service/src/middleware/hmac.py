"""HMAC-based service-to-service authentication."""
import hashlib
import hmac
import time

from fastapi import HTTPException, Request, status

from ..config import settings

MAX_AGE_SECONDS = 60


async def verify_service_token(request: Request) -> None:
    """Dependency: validate X-Service-Token + X-Timestamp headers."""
    token = request.headers.get("X-Service-Token")
    timestamp_str = request.headers.get("X-Timestamp")

    if not token or not timestamp_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing service authentication headers",
        )

    try:
        timestamp = int(timestamp_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid timestamp format",
        )

    now = int(time.time() * 1000)
    if abs(now - timestamp) > MAX_AGE_SECONDS * 1000:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Request timestamp expired",
        )

    body = await request.body()
    body_hash = hashlib.sha256(body).hexdigest()
    message = f"{timestamp}.{body_hash}"
    expected = hmac.new(
        settings.ai_service_secret.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service token",
        )
