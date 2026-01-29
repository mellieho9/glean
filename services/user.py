from typing import Dict, Optional, Tuple
from models.user import User
from services.database import get_database_client

def sign_in_with_oauth(
    provider: str,
    redirect_to: Optional[str] = None,
    scopes: Optional[str] = None
) -> Dict[str, any]:
    """
    Initiate OAuth sign-in flow with a third-party provider.

    Args:
        provider: OAuth provider name (e.g., "github", "google", "gitlab")
        redirect_to: Optional URL to redirect to after successful authentication
        scopes: Optional OAuth scopes to request (space-separated string)

    Returns:
        Dict containing the OAuth URL and provider info

    Example:
        response = sign_in_with_oauth(
            provider="github",
            redirect_to="https://example.com/auth/callback",
            scopes="repo gist notifications"
        )
        # Returns: {"url": "https://...", "provider": "github"}
    """
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


def exchange_code_for_session(code: str) -> Tuple[Optional[User], Optional[str]]:
    """
    Exchange OAuth authorization code for a user session.
    This is called in your OAuth callback endpoint.

    Args:
        code: OAuth authorization code from the callback URL

    Returns:
        Tuple of (User object, error message)
        User will be None if authentication fails

    Example:
        user, error = exchange_code_for_session(code="abc123...")
        if user:
            # Success - user is authenticated
            print(f"Logged in as {user.email}")
        else:
            print(f"Error: {error}")
    """
    client = get_database_client()

    try:
        response = client.auth.exchange_code_for_session({"auth_code": code})

        if response.user:
            user = User(
                id=response.user.id,
                name=response.user.user_metadata.get("name", ""),
                email=response.user.email or "",
                supabase_oauth=response.user.app_metadata.get("provider", "")
            )
            return user, None
        return None, "No user data returned from OAuth exchange"

    except Exception as e:
        return None, f"OAuth exchange failed: {str(e)}"


def get_current_user(access_token: str) -> Optional[User]:
    """
    Get the current authenticated user from an access token.

    Args:
        access_token: The JWT access token from the session

    Returns:
        User object if valid token, None otherwise
    """
    client = get_database_client()

    try:
        response = client.auth.get_user(access_token)

        if response.user:
            return User(
                id=response.user.id,
                name=response.user.user_metadata.get("name", ""),
                email=response.user.email or "",
                supabase_oauth=response.user.app_metadata.get("provider", "")
            )
    except Exception as e:
        print(f"Error getting current user: {e}")
    return None


def sign_out(access_token: str) -> bool:
    """
    Sign out the current user and invalidate their session.

    Args:
        access_token: The JWT access token from the session

    Returns:
        True if sign out successful, False otherwise
    """
    client = get_database_client()

    try:
        client.auth.sign_out(access_token)
        return True
    except Exception as e:
        print(f"Error signing out: {e}")
        return False


def refresh_session(refresh_token: str) -> Optional[Dict[str, str]]:
    """
    Refresh an expired access token using a refresh token.

    Args:
        refresh_token: The refresh token from the session

    Returns:
        Dict with new access_token and refresh_token, or None if refresh fails
    """
    client = get_database_client()

    try:
        response = client.auth.refresh_session(refresh_token)

        if response.session:
            return {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token
            }
    except Exception as e:
        print(f"Error refreshing session: {e}")
    return None
