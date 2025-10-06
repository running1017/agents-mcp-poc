"""Authentication utilities for OBO (On-Behalf-Of) flow."""

import logging
from typing import Optional

import msal

from .config import settings

logger = logging.getLogger(__name__)


class AuthService:
    """Service for handling OBO authentication flow with Entra ID."""

    def __init__(self):
        """Initialize MSAL confidential client application."""
        self.app = msal.ConfidentialClientApplication(
            client_id=settings.client_id,
            client_credential=settings.client_secret,
            authority=f"https://login.microsoftonline.com/{settings.tenant_id}",
        )

    async def get_obo_token(self, user_access_token: str) -> Optional[str]:
        """
        Exchange user access token for Graph API token via OBO flow.

        Args:
            user_access_token: The access token from the upstream service

        Returns:
            Graph API access token or None if authentication fails
        """
        try:
            result = self.app.acquire_token_on_behalf_of(
                user_assertion=user_access_token,
                scopes=settings.obo_scopes,
            )

            if "access_token" in result:
                logger.info("Successfully acquired OBO token")
                return result["access_token"]
            else:
                error = result.get("error")
                error_description = result.get("error_description")
                logger.error(f"OBO token acquisition failed: {error} - {error_description}")
                return None

        except Exception as e:
            logger.error(f"Exception during OBO token acquisition: {e}")
            return None


# Singleton instance
auth_service = AuthService()
