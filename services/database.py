"""Supabase database connection and client management."""
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from utils.config import config
from models.database import (
    CreateRowRequest,
    UpdateRowRequest,
    DeleteRowRequest,
    QueryRowRequest,
    RowResponse,
    RowsResponse
)


class DatabaseClient:
    """Singleton database client for Supabase."""
    
    _instance: Optional['DatabaseClient'] = None
    _client: Optional[Client] = None
    _service_client: Optional[Client] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseClient, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            client_config = config.get_client_config(use_service_role=False)
            self._client = create_client(
                client_config["supabase_url"],
                client_config["supabase_key"]
            )
        
        if self._service_client is None and config.service_role_key:
            service_config = config.get_client_config(use_service_role=True)
            self._service_client = create_client(
                service_config["supabase_url"],
                service_config["supabase_key"]
            )
    
    @property
    def client(self) -> Client:
        """Get the standard Supabase client."""
        if self._client is None:
            client_config = config.get_client_config(use_service_role=False)
            self._client = create_client(
                client_config["supabase_url"],
                client_config["supabase_key"]
            )
        return self._client
    
    @property
    def service_client(self) -> Optional[Client]:
        """Get the service role Supabase client (if available)."""
        if self._service_client is None and config.service_role_key:
            service_config = config.get_client_config(use_service_role=True)
            self._service_client = create_client(
                service_config["supabase_url"],
                service_config["supabase_key"]
            )
        return self._service_client


def get_database_client(use_service_role: bool = False) -> Client:
    """
    Get Supabase database client for dependency injection.
    
    Args:
        use_service_role: If True, use service role key (admin operations)
    
    Returns:
        Supabase Client instance
    """
    database_client = DatabaseClient()
    if use_service_role and database_client.service_client:
        return database_client.service_client
    return database_client.client


def _build_query(client: Client, table_name: str, request: QueryRowRequest):
    """Build and execute a query based on the request."""
    query = client.table(table_name)
    
    # Apply filters
    if request.filters:
        for key, value in request.filters.items():
            query = query.eq(key, value)
    
    # Apply select
    if request.select:
        query = query.select(request.select)
    
    # Apply ordering
    if request.order_by:
        if request.ascending:
            query = query.order(request.order_by, desc=False)
        else:
            query = query.order(request.order_by, desc=True)
    
    # Apply limit
    if request.limit:
        query = query.limit(request.limit)
    
    # Apply offset
    if request.offset:
        query = query.offset(request.offset)
    
    return query


def create_row(client: Client, request: CreateRowRequest) -> RowResponse:
    """
    Create a new row in the specified table.
    
    Args:
        client: Supabase client instance
        request: CreateRowRequest with table_name and data
    
    Returns:
        RowResponse with created row data
    """
    try:
        result = client.table(request.table_name).insert(request.data).execute()
        
        if result.data and len(result.data) > 0:
            return RowResponse(
                success=True,
                data=result.data[0],
                message=f"Row created successfully in {request.table_name}"
            )
        else:
            return RowResponse(
                success=False,
                error="No data returned from insert operation"
            )
    except Exception as e:
        return RowResponse(
            success=False,
            error=f"Error creating row: {str(e)}"
        )


def read_rows(client: Client, request: QueryRowRequest) -> RowsResponse:
    """
    Read rows from the specified table.
    
    Args:
        client: Supabase client instance
        request: QueryRowRequest with query parameters
    
    Returns:
        RowsResponse with queried rows
    """
    try:
        query = _build_query(client, request.table_name, request)
        result = query.execute()
        
        return RowsResponse(
            success=True,
            data=result.data,
            count=len(result.data) if result.data else 0,
            message=f"Successfully queried {request.table_name}"
        )
    except Exception as e:
        return RowsResponse(
            success=False,
            error=f"Error reading rows: {str(e)}"
        )


def update_rows(client: Client, request: UpdateRowRequest) -> RowsResponse:
    """
    Update rows in the specified table.
    
    Args:
        client: Supabase client instance
        request: UpdateRowRequest with table_name, filters, and data
    
    Returns:
        RowsResponse with updated rows
    """
    try:
        query = client.table(request.table_name)
        
        # Apply filters
        for key, value in request.filters.items():
            query = query.eq(key, value)
        
        result = query.update(request.data).execute()
        
        return RowsResponse(
            success=True,
            data=result.data,
            count=len(result.data) if result.data else 0,
            message=f"Successfully updated rows in {request.table_name}"
        )
    except Exception as e:
        return RowsResponse(
            success=False,
            error=f"Error updating rows: {str(e)}"
        )


def delete_rows(client: Client, request: DeleteRowRequest) -> RowResponse:
    """
    Delete rows from the specified table.
    
    Args:
        client: Supabase client instance
        request: DeleteRowRequest with table_name and filters
    
    Returns:
        RowResponse indicating success
    """
    try:
        query = client.table(request.table_name)
        
        # Apply filters
        for key, value in request.filters.items():
            query = query.eq(key, value)
        
        result = query.delete().execute()
        
        deleted_count = len(result.data) if result.data else 0
        
        return RowResponse(
            success=True,
            data={"deleted_count": deleted_count},
            message=f"Successfully deleted {deleted_count} row(s) from {request.table_name}"
        )
    except Exception as e:
        return RowResponse(
            success=False,
            error=f"Error deleting rows: {str(e)}"
        )
