"""FastAPI routes for database CRUD operations."""
import json
from fastapi import APIRouter, HTTPException, Depends, Query
from supabase import Client
from services.db import get_db_client, create_row, read_rows, update_rows, delete_rows
from models.database import (
    CreateRowRequest,
    UpdateRowRequest,
    DeleteRowRequest,
    QueryRowRequest,
    RowResponse,
    RowsResponse
)

router = APIRouter(prefix="/api/db", tags=["database"])


@router.post("/create", response_model=RowResponse)
async def create_row_endpoint(
    request: CreateRowRequest,
    db: Client = Depends(lambda: get_db_client(use_service_role=False))
) -> RowResponse:
    """
    Create a new row in the specified table.
    
    Args:
        request: CreateRowRequest with table_name and data
        db: Supabase client (injected)
    
    Returns:
        RowResponse with created row data
    """
    response = create_row(db, request)
    if not response.success:
        raise HTTPException(status_code=400, detail=response.error)
    return response


@router.get("/read", response_model=RowsResponse)
async def read_rows_get(
    table_name: str = Query(..., description="Name of the table to query"),
    filters: str = Query(None, description="JSON string of filter conditions"),
    select: str = Query(None, description="Comma-separated column names to select"),
    order_by: str = Query(None, description="Column name to order by"),
    ascending: bool = Query(True, description="Order direction"),
    limit: int = Query(None, description="Maximum number of rows to return"),
    offset: int = Query(None, description="Number of rows to skip"),
    db: Client = Depends(lambda: get_db_client(use_service_role=False))
) -> RowsResponse:
    """
    Read rows from the specified table with optional filters and options.
    
    Args:
        table_name: Name of the table to query
        filters: Optional JSON string of filter conditions
        select: Optional comma-separated column names
        order_by: Optional column name to order by
        ascending: Order direction
        limit: Optional maximum number of rows
        offset: Optional number of rows to skip
        db: Supabase client (injected)
    
    Returns:
        RowsResponse with queried rows
    """
    try:
        # Build query request
        query_request = QueryRowRequest(
            table_name=table_name,
            filters=json.loads(filters) if filters else None,
            select=select,
            order_by=order_by,
            ascending=ascending,
            limit=limit,
            offset=offset
        )
        
        response = read_rows(db, query_request)
        if not response.success:
            raise HTTPException(status_code=400, detail=response.error)
        return response
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON in filters parameter"
        )


@router.post("/read", response_model=RowsResponse)
async def read_rows_post(
    request: QueryRowRequest,
    db: Client = Depends(lambda: get_db_client(use_service_role=False))
) -> RowsResponse:
    """
    Read rows from the specified table using POST method (for complex queries).
    
    Args:
        request: QueryRowRequest with query parameters
        db: Supabase client (injected)
    
    Returns:
        RowsResponse with queried rows
    """
    response = read_rows(db, request)
    if not response.success:
        raise HTTPException(status_code=400, detail=response.error)
    return response


@router.put("/update", response_model=RowsResponse)
async def update_rows_endpoint(
    request: UpdateRowRequest,
    db: Client = Depends(lambda: get_db_client(use_service_role=False))
) -> RowsResponse:
    """
    Update rows in the specified table.
    
    Args:
        request: UpdateRowRequest with table_name, filters, and data
        db: Supabase client (injected)
    
    Returns:
        RowsResponse with updated rows
    """
    response = update_rows(db, request)
    if not response.success:
        raise HTTPException(status_code=400, detail=response.error)
    return response


@router.delete("/delete", response_model=RowResponse)
async def delete_rows_endpoint(
    request: DeleteRowRequest,
    db: Client = Depends(lambda: get_db_client(use_service_role=False))
) -> RowResponse:
    """
    Delete rows from the specified table.
    
    Args:
        request: DeleteRowRequest with table_name and filters
        db: Supabase client (injected)
    
    Returns:
        RowResponse indicating success
    """
    response = delete_rows(db, request)
    if not response.success:
        raise HTTPException(status_code=400, detail=response.error)
    return response
