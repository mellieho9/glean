import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class SupabaseConfig:
    
    def __init__(self):
        self.url: str = os.getenv("SUPABASE_URL", "")
        self.key: str = os.getenv("SUPABASE_KEY", "")
    
    def validate(self) -> bool:
        if not self.url:
            raise ValueError("SUPABASE_URL environment variable is required")
        if not self.key:
            raise ValueError("SUPABASE_KEY environment variable is required")
        return True
    
    def get_client_config(self) -> dict:
        self.validate()
        return {
            "supabase_url": self.url,
            "supabase_key": self.key
        }

config = SupabaseConfig()
