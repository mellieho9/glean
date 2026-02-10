import os
from typing import Dict, Optional, Tuple

from composio import Composio
from supabase import Client

from models.user import User
from services.database import create_row

_composio_client: Optional[Composio] = None
_user_sessions: Dict[Tuple[str, bool], any] = {}


DEFAULT_TOOLKIT_VERSIONS = {
    "notion": "20260130_00",
}


def get_composio_client() -> Composio:
    global _composio_client
    if _composio_client is None:
        api_key = os.getenv("COMPOSIO_API_KEY")
        if not api_key:
            raise ValueError("COMPOSIO_API_KEY environment variable not set")
        _composio_client = Composio(
            api_key=api_key, toolkit_versions=DEFAULT_TOOLKIT_VERSIONS
        )
    return _composio_client


def get_user_session(user: User, manage_connections: bool = False):
    cache_key = (user.id, manage_connections)
    if cache_key in _user_sessions:
        return _user_sessions[cache_key]

    composio = get_composio_client()
    session = composio.create(user_id=user.id, manage_connections=manage_connections)
    _user_sessions[cache_key] = session
    return session


def clear_user_session(user_id: str):
    keys_to_remove = [key for key in _user_sessions if key[0] == user_id]
    for key in keys_to_remove:
        _user_sessions.pop(key, None)


def initiate_integration(
    user: User,
    integration_slug: str,
) -> Dict[str, any]:
    """Start the OAuth flow and return the redirect URL immediately."""
    session = get_user_session(user)
    connection_request = session.authorize(integration_slug)
    return {
        "integration": integration_slug,
        "redirect_url": connection_request.redirect_url,
        "connected": False,
    }


def save_integration(
    user: User,
    integration_slug: str,
    db_client: Optional[Client] = None,
) -> Dict[str, any]:
    """Save a connected integration to the database."""
    session = get_user_session(user)
    toolkits = session.toolkits()

    for toolkit in toolkits.items:
        if (
            toolkit
            and toolkit.slug == integration_slug
            and toolkit.connection
            and toolkit.connection.is_active
        ):
            account_id = toolkit.connection.connected_account.id
            if db_client:
                integration_data = {
                    "user_id": user.id,
                    "slug": integration_slug,
                    "composio_connection_id": account_id,
                }
                try:
                    create_row("integrations", integration_data, client=db_client)
                except Exception as e:
                    print(f"Integration already saved or DB error: {e}")

            return {
                "integration": integration_slug,
                "connected": True,
                "account_id": account_id,
            }

    return {"integration": integration_slug, "connected": False}


def check_user_connections(user: User) -> Dict[str, any]:
    session = get_user_session(user)
    toolkits = session.toolkits()

    connected = []
    disconnected = []

    for toolkit in toolkits.items:
        if toolkit and toolkit.connection and toolkit.connection.is_active:
            connected.append(
                {
                    "name": toolkit.name,
                    "slug": toolkit.slug,
                    "account_id": toolkit.connection.connected_account.id,
                }
            )
        else:
            disconnected.append({"name": toolkit.name, "slug": toolkit.slug})

    return {
        "connected": connected,
        "disconnected": disconnected,
        "total_connected": len(connected),
    }
