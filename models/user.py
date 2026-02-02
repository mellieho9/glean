from typing import Optional, List
from pydantic import BaseModel

class User(BaseModel):
    id: str
    name: str
    email: str
    supabase_oauth: str
    composio_account_ids: Optional[List[str]] = None