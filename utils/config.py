"""Configuration management for Supabase credentials."""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class SupabaseConfig:
    """Configuration class for Supabase connection."""
    
    def __init__(self):
        self.url: str = os.getenv("SUPABASE_URL", "")
        self.key: str = os.getenv("SUPABASE_KEY", "")
    
    def validate(self) -> bool:
        """Validate that required configuration is present."""
        if not self.url:
            raise ValueError("SUPABASE_URL environment variable is required")
        if not self.key:
            raise ValueError("SUPABASE_KEY environment variable is required")
        return True
    
    def get_client_config(self) -> dict:
        """Get configuration for Supabase client."""
        self.validate()
        return {
            "supabase_url": self.url,
            "supabase_key": self.key
        }


# Global configuration instance
config = SupabaseConfig()
