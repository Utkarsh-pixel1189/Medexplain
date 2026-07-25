"""
Central app configuration, loaded from environment variables.
Copy .env.example to .env and fill in real values before running.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    GOOGLE_VISION_CREDENTIALS_BASE64: str | None = None

    # --- App ---
    APP_NAME: str = "Medexplain API"
    ENV: str = "development"
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # --- Auth ---
    SESSION_SECRET: str = "change-me-in-.env"  # used to sign session tokens
    SESSION_TTL_MINUTES: int = 60 * 24 * 7  # 7 days
    COOKIE_NAME: str = "medexplain_session"
    COOKIE_SECURE: bool = True  # set False only for local http dev

    # --- Database ---
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/medexplain"

    # --- Object storage (S3-compatible) ---
    S3_BUCKET: str = "medexplain-reports"
    S3_REGION: str = "us-east-1"
    S3_ENDPOINT_URL: str | None = None  # set for non-AWS S3-compatible providers
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    S3_PRESIGN_EXPIRY_SECONDS: int = 300

    # --- Mistral ---
    MISTRAL_API_KEY: str | None = None
    MISTRAL_CHAT_MODEL: str = "mistral-large-latest"
    MISTRAL_EMBED_MODEL: str = "mistral-embed"

    # --- Vector store ---
    VECTOR_STORE_PROVIDER: str = "memory"  # memory | pinecone | milvus | weaviate | supabase
    PINECONE_API_KEY: str | None = None
    PINECONE_INDEX: str | None = None

    # --- RAG ---
    RAG_TOP_K: int = 5
    CHUNK_MIN_TOKENS: int = 200
    CHUNK_MAX_TOKENS: int = 800


@lru_cache
def get_settings() -> Settings:
    return Settings()
