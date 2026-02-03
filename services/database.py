from typing import Optional, Dict, Any
from supabase import create_client, Client
from utils.config import config


class DatabaseClient:
    _instance: Optional["DatabaseClient"] = None
    _client: Optional[Client] = None
    _service_client: Optional[Client] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseClient, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            client_config = config.get_client_config()
            self._client = create_client(
                client_config["supabase_url"], client_config["supabase_key"]
            )

    @property
    def client(self) -> Client:
        if self._client is None:
            client_config = config.get_client_config()
            self._client = create_client(
                client_config["supabase_url"], client_config["supabase_key"]
            )
        return self._client

    @property
    def service_client(self) -> Optional[Client]:
        service_config = config.get_client_config()
        return create_client(
            service_config["supabase_url"], service_config["supabase_key"]
        )


def get_database_client(use_service_role: bool = False) -> Client:
    database_client = DatabaseClient()
    if use_service_role and database_client.service_client:
        return database_client.service_client
    return database_client.client


def get_authenticated_client(access_token: str) -> Client:
    client_config = config.get_client_config()

    client = create_client(client_config["supabase_url"], client_config["supabase_key"])
    client.postgrest.auth(access_token)

    return client


def create_row(
    table_name: str, data: Dict[str, Any], client: Optional[Client] = None
) -> Dict[str, Any]:
    if client is None:
        client = get_database_client()

    try:
        result = client.table(table_name).insert(data).execute()

        return {
            "success": True,
            "data": result.data[0],
            "message": f"Row created successfully in {table_name}",
        }
    except Exception as e:
        raise Exception(f"Error creating row: {str(e)}")


def read_rows(
    table_name: str,
    filters: Optional[Dict[str, Any]] = None,
    select: str = "*",
    order_by: Optional[str] = None,
    ascending: bool = True,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    client: Optional[Client] = None,
) -> Dict[str, Any]:
    if client is None:
        client = get_database_client()

    try:
        query = client.table(table_name).select(select)

        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)

        if order_by:
            query = query.order(order_by, desc=not ascending)

        if limit:
            query = query.limit(limit)

        if offset:
            query = query.offset(offset)

        result = query.execute()

        return {
            "success": True,
            "data": result.data,
            "count": len(result.data) if result.data else 0,
            "message": f"Successfully queried {table_name}",
        }
    except Exception as e:
        raise Exception(f"Error reading rows: {str(e)}")


def update_rows(
    table_name: str,
    filters: Dict[str, Any],
    data: Dict[str, Any],
    client: Optional[Client] = None,
) -> Dict[str, Any]:
    if client is None:
        client = get_database_client()

    try:
        query = client.table(table_name)

        for key, value in filters.items():
            query = query.eq(key, value)

        result = query.update(data).execute()

        return {
            "success": True,
            "data": result.data,
            "count": len(result.data) if result.data else 0,
            "message": f"Successfully updated rows in {table_name}",
        }
    except Exception as e:
        raise Exception(f"Error updating rows: {str(e)}")


def delete_rows(
    table_name: str, filters: Dict[str, Any], client: Optional[Client] = None
) -> Dict[str, Any]:
    if client is None:
        client = get_database_client()

    try:
        query = client.table(table_name)

        for key, value in filters.items():
            query = query.eq(key, value)

        result = query.delete().execute()

        deleted_count = len(result.data) if result.data else 0

        return {
            "success": True,
            "deleted_count": deleted_count,
            "message": f"Successfully deleted {deleted_count} row(s) from {table_name}",
        }
    except Exception as e:
        raise Exception(f"Error deleting rows: {str(e)}")
