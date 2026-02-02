"""Pydantic models for integrations and schemas."""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class Integration(BaseModel):
    """Connected integration (Google Sheets, Notion, etc.)"""
    user_id: str
    slug: str  # 'googlesheets', 'notion'
    composio_connection_id: str


class Schema(BaseModel):
    """Inferred schema for a data source"""
    source_id: str
    user_id: str
    version: int
    schema: Dict[str, Any]  # The actual schema JSON
    slug: str 
    prompt: str