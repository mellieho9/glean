from typing import Dict, Optional, Tuple
from models.user import User
from services.database import get_database_client


def sign_in_with_oauth(
    provider: str, redirect_to: Optional[str] = None, scopes: Optional[str] = None
) -> Dict[str, any]:
    client = get_database_client()

    options = {}
    if redirect_to:
        options["redirect_to"] = redirect_to
    if scopes:
        options["scopes"] = scopes

    credentials = {"provider": provider}
    if options:
        credentials["options"] = options

    response = client.auth.sign_in_with_oauth(credentials)

    return {
        "url": response.url,
    }


def exchange_code_for_session(code: str) -> Tuple[Optional[Dict], Optional[str]]:
    client = get_database_client()

    try:
        response = client.auth.exchange_code_for_session({"auth_code": code})

        if response.user and response.session:
            user = User(
                id=response.user.id,
                name=response.user.user_metadata.get("name", ""),
                email=response.user.email or "",
                supabase_oauth=response.user.app_metadata.get("provider", ""),
            )
            return {
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "supabase_oauth": user.supabase_oauth,
                },
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
            }, None
        return None, "No user data returned from OAuth exchange"

    except Exception as e:
        return None, f"OAuth exchange failed: {str(e)}"


def get_current_user(access_token: str) -> Optional[User]:
    client = get_database_client()

    try:
        response = client.auth.get_user(access_token)

        if response.user:
            return User(
                id=response.user.id,
                name=response.user.user_metadata.get("name", ""),
                email=response.user.email or "",
                supabase_oauth=response.user.app_metadata.get("provider", ""),
            )
    except Exception as e:
        raise Exception(f"Error getting current user: {e}")


def sign_out(access_token: str) -> bool:
    client = get_database_client()

    try:
        client.auth.sign_out(access_token)
        return True
    except Exception as e:
        raise Exception(f"Error signing out: {e}")


def refresh_session(refresh_token: str) -> Optional[Dict[str, str]]:
    client = get_database_client()

    try:
        response = client.auth.refresh_session(refresh_token)

        if response.session:
            return {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
            }
    except Exception as e:
        raise Exception(f"Error refreshing session: {e}")
