from pydantic import BaseModel
from typing import Dict, Any


class Integration(BaseModel):
    user_id: str
    slug: str  # 'googlesheets', 'notion'
    composio_connection_id: str


class Schema(BaseModel):
    source_id: str
    user_id: str
    version: int
    schema: Dict[str, Any]  # The actual schema JSON
    slug: str
    prompt: str
