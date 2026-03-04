import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class Config:
    def __init__(self):
        self.supabase_url: str = os.getenv("SUPABASE_URL", "")
        self.supabase_key: str = os.getenv("SUPABASE_KEY", "")
        self.supabase_service_role_key: Optional[str] = os.getenv(
            "SUPABASE_SERVICE_ROLE_KEY"
        )
        self.google_api_key: str = os.getenv("GOOGLE_API_KEY", "")
        self.composio_api_key: str = os.getenv("COMPOSIO_API_KEY", "")

        # AWS config — populated by ECS task definition at runtime
        self.aws_region: str = os.getenv("AWS_REGION", "us-east-1")
        self.s3_bucket_name: str = os.getenv("S3_BUCKET_NAME", "")
        self.environment: str = os.getenv("ENVIRONMENT", "development")

    def validate(self) -> bool:
        if not self.supabase_url:
            raise ValueError("SUPABASE_URL environment variable is required")
        if not self.supabase_key:
            raise ValueError("SUPABASE_KEY environment variable is required")
        if not self.google_api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
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
