from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Body, Path, Query, Header

from services.schema_handler import get_schema_handler
from services.user import get_current_user


router = APIRouter(prefix="/schema", tags=["schema"])


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
        raise HTTPException(
            status_code=500, detail="Failed to list sources"
        ) from e


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
            status_code=500, detail=f"Failed to get schema: {str(e)}"
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
            status_code=500, detail=f"Failed to read data: {str(e)}"
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
            status_code=500, detail=f"Failed to write data: {str(e)}"
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
            status_code=500, detail=f"Failed to update data: {str(e)}"
        ) from e
