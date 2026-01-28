"""FastAPI routes for database CRUD operations."""
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from supabase import Client
from services.database import get_database_client, create_row, read_rows, update_rows, delete_rows
from services.user import get_current_user, check_table_permission, CurrentUser
from models.database import (
    CreateRowRequest,
    UpdateRowRequest,
    DeleteRowRequest,
    QueryRowRequest,
    RowResponse,
    RowsResponse
)

router = APIRouter(prefix="/api/database", tags=["database"])

# Allowlist of permissible table names for create operations
# TODO: Configure this based on your application's requirements
ALLOWED_TABLES = {
    # Add your allowed table names here
    # Example: "users", "posts", "comments"
}

def verify_rls_enabled(client: Client, table_name: str) -> bool:
    """
    Verify that Row-Level Security (RLS) is enabled for the specified table.
    
    This function attempts to check RLS status by querying PostgreSQL system tables.
    Since this requires elevated privileges, it uses a service role client if available.
    
    Args:
        client: Supabase client (should be service role for system table access)
        table_name: Name of the table to check
    
    Returns:
        True if RLS is enabled, False otherwise
    
    Note: This is a best-effort check. If we cannot verify (e.g., insufficient privileges),
    we return False to fail-safe (deny access).
    """
    try:
        # Query PostgreSQL system catalog to check if RLS is enabled
        # This requires access to pg_class and pg_tables
        # Using raw SQL query through Supabase RPC or direct PostgreSQL connection
        result = client.rpc(
            "check_rls_enabled",
            {"table_name": table_name}
        ).execute()
        
        if result.data:
            return result.data.get("rls_enabled", False)
    except Exception:
        # If RPC doesn't exist or we can't check, fail-safe by returning False
        # In production, you might want to log this or have a configuration flag
        pass
    
    # Alternative: Try to query pg_class directly (requires service role)
    try:
        # This is a fallback - query system tables directly
        # Note: This may not work with standard Supabase client
        # In practice, you should set up an RPC function in Supabase to check RLS
        pass
    except Exception:
        pass
    
    # Fail-safe: If we can't verify RLS, deny access
    # In production, you may want to:
    # 1. Set up a Supabase RPC function to check RLS
    # 2. Maintain a configuration list of tables with RLS enabled
    # 3. Use a service role client to query pg_class directly
    return False


@router.post("/create", response_model=RowResponse)
async def create_row_endpoint(
    request: CreateRowRequest,
    database: Client = Depends(lambda: get_database_client(use_service_role=False)),
    current_user: CurrentUser = Depends(get_current_user)
) -> RowResponse:
    """
    Create a new row in the specified table.
    
    Args:
        request: CreateRowRequest with table_name and data
        database: Supabase client (injected)
        current_user: Current authenticated user (injected)
    
    Returns:
        RowResponse with created row data
    
    Raises:
        HTTPException: 403 if table not in allowlist or user lacks permission
        HTTPException: 403 if RLS is not enabled for the table
    """
    # Server-side validation: enforce allowlist of permissible table names
    if ALLOWED_TABLES and request.table_name not in ALLOWED_TABLES:
        raise HTTPException(
            status_code=403,
            detail=f"Table '{request.table_name}' is not in the allowlist of permissible tables"
        )
    
    # Authorization check: verify user has permission to write to the requested table
    if not check_table_permission(current_user, request.table_name, operation="write"):
        raise HTTPException(
            status_code=403,
            detail=f"User does not have permission to write to table '{request.table_name}'"
        )
    
    # Verify that Supabase Row-Level Security (RLS) is enabled for the target table
    # Use service role client to check RLS status
    try:
        service_client = get_database_client(use_service_role=True)
        rls_enabled = verify_rls_enabled(service_client, request.table_name)
        if not rls_enabled:
            raise HTTPException(
                status_code=403,
                detail=f"Row-Level Security (RLS) is not enabled for table '{request.table_name}'. RLS must be enabled for security."
            )
    except RuntimeError:
        # Service role client not available - fail-safe: deny access
        raise HTTPException(
            status_code=403,
            detail="Cannot verify Row-Level Security (RLS) status. Service role client not available. Access denied for safety."
        )
    
    response = create_row(database, request)
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
    database: Client = Depends(lambda: get_database_client(use_service_role=False))
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
        database: Supabase client (injected)
    
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
        
        response = read_rows(database, query_request)
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
    database: Client = Depends(lambda: get_database_client(use_service_role=False))
) -> RowsResponse:
    """
    Read rows from the specified table using POST method (for complex queries).
    
    Args:
        request: QueryRowRequest with query parameters
        database: Supabase client (injected)
    
    Returns:
        RowsResponse with queried rows
    """
    response = read_rows(database, request)
    if not response.success:
        raise HTTPException(status_code=400, detail=response.error)
    return response


@router.put("/update", response_model=RowsResponse)
async def update_rows_endpoint(
    request: UpdateRowRequest,
    database: Client = Depends(lambda: get_database_client(use_service_role=False))
) -> RowsResponse:
    """
    Update rows in the specified table.
    
    Args:
        request: UpdateRowRequest with table_name, filters, and data
        database: Supabase client (injected)
    
    Returns:
        RowsResponse with updated rows
    """
    response = update_rows(database, request)
    if not response.success:
        raise HTTPException(status_code=400, detail=response.error)
    return response


@router.delete("/delete", response_model=RowResponse)
async def delete_rows_endpoint(
    request: DeleteRowRequest,
    database: Client = Depends(lambda: get_database_client(use_service_role=False))
) -> RowResponse:
    """
    Delete rows from the specified table.
    
    Args:
        request: DeleteRowRequest with table_name and filters
        database: Supabase client (injected)
    
    Returns:
        RowResponse indicating success
    """
    response = delete_rows(database, request)
    if not response.success:
        raise HTTPException(status_code=400, detail=response.error)
    return response
