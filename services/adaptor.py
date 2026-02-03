import os
from typing import Dict, Optional

from composio import Composio

from supabase import Client

from models.user import User
from services.database import create_row


_composio_client: Optional[Composio] = None
_user_sessions: Dict[str, any] = {}


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
            api_key=api_key,
            toolkit_versions=DEFAULT_TOOLKIT_VERSIONS
        )
    return _composio_client


def get_user_session(user: User, manage_connections: bool = False):
    if user.id in _user_sessions:
        return _user_sessions[user.id]

    composio = get_composio_client()
    session = composio.create(
        user_id=user.id,
        manage_connections=manage_connections
    )
    _user_sessions[user.id] = session
    return session


def clear_user_session(user_id: str):
    _user_sessions.pop(user_id, None)


def authorize_integration(
    user: User,
    integration_slug: str,
    timeout_ms: int = 60000,
    db_client: Optional[Client] = None
) -> Dict[str, any]:
    session = get_user_session(user)

    connection_request = session.authorize(integration_slug)
    redirect_url = connection_request.redirect_url

    print(f"OAuth link for {integration_slug}: {redirect_url}")

    try:
        connected_account = connection_request.wait_for_connection(timeout_ms)

        if db_client:
            integration_data = {
                "user_id": user.id,
                "slug": integration_slug,
                "composio_connection_id": connected_account.id
            }

            print(f"DEBUG: Attempting to insert integration with user_id: {user.id}")
            print(f"DEBUG: Integration data: {integration_data}")

            create_row("integrations", integration_data, client=db_client)

        return {
            "integration": integration_slug,
            "redirect_url": redirect_url,
            "connected": True,
            "account_id": connected_account.id,
        }
    except Exception as e:
        raise Exception(f"Error authorizing integration: {str(e)}")


def check_user_connections(user: User) -> Dict[str, any]:
    session = get_user_session(user)
    toolkits = session.toolkits()

    connected = []
    disconnected = []

    for toolkit in toolkits.items:
        if toolkit and toolkit.connection and toolkit.connection.is_active:
            connected.append({
                "name": toolkit.name,
                "slug": toolkit.slug,
                "account_id": toolkit.connection.connected_account.id
            })
        else:
            disconnected.append({
                "name": toolkit.name,
                "slug": toolkit.slug
            })

    return {
        "connected": connected,
        "disconnected": disconnected,
        "total_connected": len(connected)
    }
