from pydantic import BaseModel

class User(BaseModel):
    id: str
    name: str
    email: str
    supabase_oauth: str