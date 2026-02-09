import json
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Body, Path, Query, Header

from services.schema_handler import get_schema_handler
from services.user import get_current_user
from services.database import read_rows, get_database_client


router = APIRouter(prefix="/schema", tags=["schema"])


@router.get("/configured")
async def list_configured_schemas(
    access_token: str = Header(..., alias="Authorization"),
) -> List[Dict[str, Any]]:
    user = get_current_user(access_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token or user not found")
    try:
        db_client = get_database_client(use_service_role=True)
        result = read_rows(
            "schemas",
            filters={"user_id": user.id},
            select="source_id,slug,schema",
            client=db_client,
        )
        rows = result.get("data", [])
        schemas = []
        for row in rows:
            schema_data = row.get("schema") or {}
            if isinstance(schema_data, str):
                schema_data = json.loads(schema_data)
            schemas.append({
                "source_id": row["source_id"],
                "integration": row.get("slug", "notion"),
                "name": schema_data.get("title", row["source_id"]),
            })
        return schemas
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to list schemas: {str(e)}"
        ) from e


@router.get("/{integration}/sources")
async def list_sources(
    integration: str = Path(..., description="Integration slug (notion, googlesheets)"),
    access_token: str = Header(..., alias="Authorization"),
    query: Optional[str] = Query(None),
) -> List[Dict[str, Any]]:
    user = get_current_user(access_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token or user not found")
    try:
        handler = get_schema_handler(user, integration)
        return handler.list_sources(query=query)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to list sources") from e


@router.get("/{integration}")
async def get_schema(
    integration: str = Path(...),
    access_token: str = Header(..., alias="Authorization"),
    source_id: str = Query(...),
) -> Dict[str, Any]:
    user = get_current_user(access_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token or user not found")
    try:
        handler = get_schema_handler(user, integration)
        return handler.get_schema(source_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Failed to get schema"
        ) from e


@router.get("/{integration}/data")
async def read_data(
    integration: str = Path(...),
    access_token: str = Header(..., alias="Authorization"),
    source_id: str = Query(...),
    query: Optional[str] = Query(None),
    limit: Optional[int] = Query(None),
) -> List[Dict[str, Any]]:
    user = get_current_user(access_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token or user not found")
    try:
        handler = get_schema_handler(user, integration)
        return handler.read_data(source_id, query=query, limit=limit)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to read data"
        ) from e


@router.post("/{integration}/data")
async def write_data(
    integration: str = Path(...),
    access_token: str = Header(..., alias="Authorization"),
    source_id: str = Body(...),
    data: List[Dict[str, Any]] = Body(...),
) -> Dict[str, Any]:
    user = get_current_user(access_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token or user not found")
    try:
        handler = get_schema_handler(user, integration)
        return handler.write_data(source_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Failed to write data"
        ) from e


@router.patch("/{integration}/data/{record_id}")
async def update_data(
    integration: str = Path(...),
    record_id: str = Path(...),
    access_token: str = Header(..., alias="Authorization"),
    source_id: str = Body(...),
    data: Dict[str, Any] = Body(...),
) -> Dict[str, Any]:
    user = get_current_user(access_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token or user not found")
    try:
        handler = get_schema_handler(user, integration)
        return handler.update_data(source_id, record_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update data"
        ) from e
