"""Pydantic models for database CRUD operations."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CreateRowRequest(BaseModel):
    """Request model for creating a new row."""
    table_name: str = Field(..., description="Name of the table to insert into")
    data: Dict[str, Any] = Field(..., description="Data to insert as key-value pairs")


class UpdateRowRequest(BaseModel):
    """Request model for updating rows."""
    table_name: str = Field(..., description="Name of the table to update")
    filters: Dict[str, Any] = Field(..., description="Filter conditions (e.g., {'id': 1})")
    data: Dict[str, Any] = Field(..., description="Data to update as key-value pairs")


class DeleteRowRequest(BaseModel):
    """Request model for deleting rows."""
    table_name: str = Field(..., description="Name of the table to delete from")
    filters: Dict[str, Any] = Field(..., description="Filter conditions (e.g., {'id': 1})")


class QueryRowRequest(BaseModel):
    """Request model for querying rows."""
    table_name: str = Field(..., description="Name of the table to query")
    filters: Optional[Dict[str, Any]] = Field(None, description="Optional filter conditions")
    select: Optional[str] = Field(None, description="Comma-separated column names to select")
    order_by: Optional[str] = Field(None, description="Column name to order by")
    ascending: bool = Field(True, description="Order direction (True for ASC, False for DESC)")
    limit: Optional[int] = Field(None, description="Maximum number of rows to return")
    offset: Optional[int] = Field(None, description="Number of rows to skip")


class RowResponse(BaseModel):
    """Response model for single row operations."""
    success: bool = Field(..., description="Whether the operation was successful")
    data: Optional[Dict[str, Any]] = Field(None, description="Row data")
    message: Optional[str] = Field(None, description="Response message")
    error: Optional[str] = Field(None, description="Error message if operation failed")


class RowsResponse(BaseModel):
    """Response model for multiple rows operations."""
    success: bool = Field(..., description="Whether the operation was successful")
    data: Optional[List[Dict[str, Any]]] = Field(None, description="List of row data")
    count: Optional[int] = Field(None, description="Number of rows returned")
    message: Optional[str] = Field(None, description="Response message")
    error: Optional[str] = Field(None, description="Error message if operation failed")
