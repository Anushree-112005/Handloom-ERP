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
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/dinesh_textile_erp"

    # JWT Auth
    SECRET_KEY: str = "dinesh_textile_erp_secret_change_in_production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
