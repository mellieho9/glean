"""FastAPI routes for Composio integrations."""
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Body, Depends
from services.adaptor import (
    authorize_integration,
    check_user_connections,
    clear_user_session
)
from services.user import get_current_user
from models.user import User


router = APIRouter(prefix="/api/integrations", tags=["integrations"])


async def get_authenticated_user(access_token: str = Body(...)) -> User:
    """Dependency to get authenticated user from access token."""
    user = get_current_user(access_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token or user not found")
    return user


@router.post("/authorize")
async def authorize(
    access_token: str = Body(...),
    integration_slug: str = Body(...),
    timeout_ms: int = Body(60000)
) -> Dict[str, Any]:
    """
    Generate OAuth link and wait for user to complete authorization for an integration.

    Args:
        access_token: User's JWT access token
        integration_slug: Integration name (e.g., "googlesheets", "notion", "slack")
        timeout_ms: Timeout in milliseconds to wait for connection (default: 60s)

    Returns:
        Dict with connection info including redirect_url and account details
    """
    user = await get_authenticated_user(access_token)
    return authorize_integration(user, integration_slug, timeout_ms)


@router.post("/connections")
async def get_connections(access_token: str = Body(...)) -> Dict[str, Any]:
    """
    Check which integrations are already connected for a user.

    Args:
        access_token: User's JWT access token

    Returns:
        Dict with connected and disconnected integration details
    """
    user = await get_authenticated_user(access_token)
    return check_user_connections(user)


@router.post("/clear-session")
async def clear_session(access_token: str = Body(...)) -> Dict[str, str]:
    """
    Clear cached Composio session for a user.

    Args:
        access_token: User's JWT access token

    Returns:
        Success message
    """
    user = await get_authenticated_user(access_token)
    clear_user_session(user.id)
    return {"message": "Session cleared successfully"}
