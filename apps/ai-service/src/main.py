import structlog
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routes.caption import router as caption_router
from .routes.health import router as health_router
from .routes.plan import router as plan_router

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        structlog.dev.ConsoleRenderer() if settings.node_env != "production"
        else structlog.processors.JSONRenderer(),
    ],
)

logger = structlog.get_logger(__name__)

app = FastAPI(
    title="Roamera AI Service",
    version="0.0.1",
    description="Provider-agnostic AI microservice for Roamera",
    docs_url="/docs" if settings.node_env != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(plan_router)
app.include_router(caption_router)


@app.on_event("startup")
async def startup() -> None:
    logger.info("Roamera AI service started", provider=settings.ai_provider, port=settings.port)


if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=settings.port, reload=settings.node_env != "production")
