"""
Application configuration loaded from environment variables.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Dinesh Textile ERP"
    FRONTEND_URL: str = "http://localhost:5173"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./textile_erp.db"

    # JWT Auth
    SECRET_KEY: str = "dinesh_textile_erp_secret_change_in_production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"

    # Groq LLM
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
