import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class Config:
    def __init__(self):
        # Supabase
        self.supabase_url: str = os.getenv("SUPABASE_URL", "")
        self.supabase_key: str = os.getenv("SUPABASE_KEY", "")
        self.supabase_service_role_key: Optional[str] = os.getenv(
            "SUPABASE_SERVICE_ROLE_KEY"
        )
        # Gemini
        self.google_genai_api_key: str = os.getenv("GOOGLE_GENAI_API_KEY", "")

    def validate(self) -> bool:
        if not self.supabase_url:
            raise ValueError("SUPABASE_URL environment variable is required")
        if not self.supabase_key:
            raise ValueError("SUPABASE_KEY environment variable is required")
        if not self.google_genai_api_key:
            raise ValueError("GOOGLE_GENAI_API_KEY environment variable is required")
        return True

    def get_client_config(self) -> dict:
        if not self.supabase_url:
            raise ValueError("SUPABASE_URL environment variable is required")
        if not self.supabase_key:
            raise ValueError("SUPABASE_KEY environment variable is required")
        return {"supabase_url": self.supabase_url, "supabase_key": self.supabase_key}

    def get_service_client_config(self) -> Optional[dict]:
        if not self.supabase_url or not self.supabase_service_role_key:
            return None
        return {
            "supabase_url": self.supabase_url,
            "supabase_key": self.supabase_service_role_key,
        }


config = Config()
