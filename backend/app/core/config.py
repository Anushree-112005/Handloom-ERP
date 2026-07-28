"""
Application configuration loaded from environment variables.
"""
from pydantic_settings import BaseSettings
from typing import Optional, List


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

    # Groq LLM — primary key (backward compat)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Groq LLM — multiple keys comma-separated for rotation
    GROQ_API_KEYS: Optional[str] = None

    # NVIDIA Vision API
    NVIDIA_API_KEY: Optional[str] = None
    NVIDIA_VISION_MODEL: str = "nvidia/nemotron-nano-12b-v2-vl"

    def get_groq_api_keys(self) -> List[str]:
        """Return a deduplicated list of all configured Groq API keys."""
        keys = []
        if self.GROQ_API_KEYS:
            for k in self.GROQ_API_KEYS.split(","):
                k = k.strip()
                if k and k not in keys:
                    keys.append(k)
        if self.GROQ_API_KEY and self.GROQ_API_KEY not in keys:
            keys.append(self.GROQ_API_KEY)
        return keys

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
