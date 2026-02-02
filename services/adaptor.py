import os
from typing import Dict, Optional

from composio import Composio

from supabase import Client

from models.user import User
from services.database import create_row


_composio_client: Optional[Composio] = None
_user_sessions: Dict[str, any] = {}


def get_composio_client() -> Composio:
    """Initialize and return Composio client (singleton)"""
    global _composio_client
    if _composio_client is None:
        api_key = os.getenv("COMPOSIO_API_KEY")
        if not api_key:
            raise ValueError("COMPOSIO_API_KEY environment variable not set")
        _composio_client = Composio(api_key=api_key)
    return _composio_client


def get_user_session(user: User, manage_connections: bool = False):
    """Get or create a Composio session for a user (cached per user)"""
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
    """Clear cached session for a user"""
    _user_sessions.pop(user_id, None)


def authorize_integration(
    user: User,
    integration_slug: str,
    timeout_ms: int = 60000,
    db_client: Optional[Client] = None
) -> Dict[str, any]:
    """
    Generate OAuth link and wait for user to complete authorization for any integration.

    Args:
        user: User object
        integration_slug: Integration name (e.g., "googlesheets", "notion", "slack")
        timeout_ms: Timeout in milliseconds to wait for connection (default: 60 seconds)
        db_client: Optional authenticated Supabase client for database operations (required for RLS)

    Returns:
        Dict with connection info including redirect_url and connected_account details
    """
    session = get_user_session(user)

    connection_request = session.authorize(integration_slug)
    redirect_url = connection_request.redirect_url

    print(f"OAuth link for {integration_slug}: {redirect_url}")

    try:
        connected_account = connection_request.wait_for_connection(timeout_ms)

        # Create integration entry in Supabase (if authenticated client provided)
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
    """
    Check which integrations are already connected for a user.

    Returns:
        Dict with connected and disconnected integration details
    """
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
