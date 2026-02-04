from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from services.user import (
    sign_in_with_oauth,
    exchange_code_for_session,
    get_current_user,
    sign_out,
    refresh_session,
)


router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/oauth")
async def oauth_sign_in(
    provider: str = Body(...),
    redirect_to: Optional[str] = Body(None),
    scopes: Optional[str] = Body(None),
) -> Dict[str, Any]:
    try:
        return sign_in_with_oauth(
            provider=provider, redirect_to=redirect_to, scopes=scopes
        )
    except Exception:
        # Log the actual error for debugging
        # logger.error(f"OAuth initiation failed: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to initiate OAuth"
        )


@router.get("/oauth/callback")
async def oauth_callback(code: str = Query(...)) -> Dict[str, Any]:
    """
    Exchange OAuth authorization code for a user session.

    Returns:
        Dict with user data and tokens
    """
    session, error = exchange_code_for_session(code)

    if error:
        raise HTTPException(status_code=401, detail=error)

    return {"message": "Authentication successful", **session}


@router.get("/user")
async def get_user(access_token: str = Query(...)) -> Dict[str, Any]:
    user = get_current_user(access_token)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid token or user not found")

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "supabase_oauth": user.supabase_oauth,
    }


@router.post("/sign-out")
async def sign_out_endpoint(access_token: str = Body(...)) -> Dict[str, str]:
    success = sign_out(access_token)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to sign out")

    return {"message": "Successfully signed out"}


@router.post("/refresh")
async def refresh_token_endpoint(refresh_token: str = Body(...)) -> Dict[str, Any]:
    result = refresh_session(refresh_token)

    if not result:
        raise HTTPException(status_code=401, detail="Failed to refresh session")

    return result


@router.post("/refresh")
async def refresh_token(refresh_token: str = Body(...)) -> Dict[str, Any]:
    result = refresh_session(refresh_token)

    if not result:
        raise HTTPException(status_code=401, detail="Failed to refresh session")

    return result
