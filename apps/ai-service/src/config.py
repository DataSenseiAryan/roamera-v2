from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8000
    node_env: str = "development"

    # AI provider selection
    ai_provider: str = "gemini"  # gemini | groq | openai | anthropic
    ai_fallback_provider: str = "groq"

    # Provider API keys
    google_api_key: str = ""
    groq_api_key: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # Service-to-service auth
    ai_service_secret: str = "dev-ai-service-secret-change-in-production-32"

    # Timeouts
    ai_timeout_seconds: int = 60
    ai_max_retries: int = 2


settings = Settings()
