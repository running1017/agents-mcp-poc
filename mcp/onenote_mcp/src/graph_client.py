"""Microsoft Graph API client for OneNote operations."""

import logging
from typing import Any, Optional

import httpx

from .config import settings
from .trace_context import TraceContext

logger = logging.getLogger(__name__)


class GraphClient:
    """Client for interacting with Microsoft Graph API."""

    def __init__(self, access_token: str, trace_context: Optional[TraceContext] = None):
        """
        Initialize Graph API client.

        Args:
            access_token: Access token for Microsoft Graph API
            trace_context: W3C trace context for distributed tracing
        """
        self.access_token = access_token
        self.trace_context = trace_context
        self.base_url = settings.graph_api_base_url

    def _get_headers(self) -> dict[str, str]:
        """
        Build HTTP headers including authorization and trace context.

        Returns:
            Dictionary of HTTP headers
        """
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        # Add W3C trace context headers if available
        if self.trace_context:
            headers.update(self.trace_context.to_headers())

        return headers

    async def get(self, endpoint: str, params: Optional[dict[str, Any]] = None) -> dict[str, Any]:
        """
        Perform GET request to Graph API.

        Args:
            endpoint: API endpoint path (e.g., "/me/onenote/notebooks")
            params: Optional query parameters

        Returns:
            JSON response data
        """
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()

        logger.info(f"GET {url} with trace: {self.trace_context}")

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()

    async def post(
        self, endpoint: str, data: Optional[dict[str, Any]] = None
    ) -> dict[str, Any]:
        """
        Perform POST request to Graph API.

        Args:
            endpoint: API endpoint path
            data: Request body data

        Returns:
            JSON response data
        """
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()

        logger.info(f"POST {url} with trace: {self.trace_context}")

        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=data)
            response.raise_for_status()
            return response.json()

    async def search(self, query: str) -> dict[str, Any]:
        """
        Search across all OneNote content.

        Args:
            query: Search query string

        Returns:
            Search results from Graph API
        """
        endpoint = "/me/onenote/pages"
        params = {"search": query}
        return await self.get(endpoint, params=params)
