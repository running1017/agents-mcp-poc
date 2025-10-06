"""OneNote MCP Server with FastMCP, OBO flow and W3C trace-context support."""

import logging
from typing import Annotated, Optional

from fastmcp import FastMCP
from fastmcp.exceptions import InvalidRequestError
from pydantic import BaseModel, Field

from .auth import auth_service
from .config import settings
from .graph_client import GraphClient
from .trace_context import TraceContext

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastMCP server
mcp = FastMCP("OneNote MCP Server")


class NotebookInfo(BaseModel):
    """OneNote notebook information."""

    id: str
    display_name: str
    created_datetime: Optional[str] = None
    last_modified_datetime: Optional[str] = None


class SectionInfo(BaseModel):
    """OneNote section information."""

    id: str
    display_name: str
    created_datetime: Optional[str] = None
    last_modified_datetime: Optional[str] = None


class PageInfo(BaseModel):
    """OneNote page information."""

    id: str
    title: str
    content_url: Optional[str] = None
    created_datetime: Optional[str] = None
    last_modified_datetime: Optional[str] = None


class SearchResult(BaseModel):
    """OneNote search result."""

    page_id: str
    title: str
    preview: Optional[str] = None
    content_url: Optional[str] = None


async def get_graph_client(
    access_token: Annotated[str, Field(description="User access token for OBO flow")],
    traceparent: Annotated[
        Optional[str], Field(description="W3C traceparent header")
    ] = None,
    tracestate: Annotated[Optional[str], Field(description="W3C tracestate header")] = None,
) -> GraphClient:
    """
    Create authenticated Graph API client with OBO flow.

    Args:
        access_token: User access token from upstream service
        traceparent: W3C traceparent header for distributed tracing
        tracestate: Optional W3C tracestate header

    Returns:
        Authenticated GraphClient instance

    Raises:
        InvalidRequestError: If OBO token acquisition fails
    """
    # Parse trace context from headers
    trace_context = None
    if traceparent:
        headers = {"traceparent": traceparent}
        if tracestate:
            headers["tracestate"] = tracestate
        trace_context = TraceContext.from_headers(headers)

    # Acquire OBO token
    obo_token = await auth_service.get_obo_token(access_token)
    if not obo_token:
        logger.error("Failed to acquire OBO token")
        raise InvalidRequestError("Authentication failed: Unable to acquire OBO token")

    return GraphClient(obo_token, trace_context)


@mcp.tool()
async def list_notebooks(
    access_token: Annotated[str, Field(description="User access token for OBO flow")],
    traceparent: Annotated[
        Optional[str], Field(description="W3C traceparent header")
    ] = None,
    tracestate: Annotated[Optional[str], Field(description="W3C tracestate header")] = None,
) -> list[NotebookInfo]:
    """
    List all OneNote notebooks accessible to the user.

    Args:
        access_token: User access token for OBO flow
        traceparent: W3C traceparent header for distributed tracing
        tracestate: Optional W3C tracestate header

    Returns:
        List of notebook information
    """
    client = await get_graph_client(access_token, traceparent, tracestate)
    result = await client.get("/me/onenote/notebooks")

    notebooks = []
    for item in result.get("value", []):
        notebooks.append(
            NotebookInfo(
                id=item["id"],
                display_name=item["displayName"],
                created_datetime=item.get("createdDateTime"),
                last_modified_datetime=item.get("lastModifiedDateTime"),
            )
        )

    logger.info(f"Retrieved {len(notebooks)} notebooks")
    return notebooks


@mcp.tool()
async def list_sections(
    notebook_id: Annotated[str, Field(description="Notebook ID")],
    access_token: Annotated[str, Field(description="User access token for OBO flow")],
    traceparent: Annotated[
        Optional[str], Field(description="W3C traceparent header")
    ] = None,
    tracestate: Annotated[Optional[str], Field(description="W3C tracestate header")] = None,
) -> list[SectionInfo]:
    """
    List all sections in a OneNote notebook.

    Args:
        notebook_id: The ID of the notebook
        access_token: User access token for OBO flow
        traceparent: W3C traceparent header for distributed tracing
        tracestate: Optional W3C tracestate header

    Returns:
        List of section information
    """
    client = await get_graph_client(access_token, traceparent, tracestate)
    result = await client.get(f"/me/onenote/notebooks/{notebook_id}/sections")

    sections = []
    for item in result.get("value", []):
        sections.append(
            SectionInfo(
                id=item["id"],
                display_name=item["displayName"],
                created_datetime=item.get("createdDateTime"),
                last_modified_datetime=item.get("lastModifiedDateTime"),
            )
        )

    logger.info(f"Retrieved {len(sections)} sections for notebook {notebook_id}")
    return sections


@mcp.tool()
async def list_pages(
    section_id: Annotated[str, Field(description="Section ID")],
    access_token: Annotated[str, Field(description="User access token for OBO flow")],
    traceparent: Annotated[
        Optional[str], Field(description="W3C traceparent header")
    ] = None,
    tracestate: Annotated[Optional[str], Field(description="W3C tracestate header")] = None,
) -> list[PageInfo]:
    """
    List all pages in a OneNote section.

    Args:
        section_id: The ID of the section
        access_token: User access token for OBO flow
        traceparent: W3C traceparent header for distributed tracing
        tracestate: Optional W3C tracestate header

    Returns:
        List of page information
    """
    client = await get_graph_client(access_token, traceparent, tracestate)
    result = await client.get(f"/me/onenote/sections/{section_id}/pages")

    pages = []
    for item in result.get("value", []):
        pages.append(
            PageInfo(
                id=item["id"],
                title=item["title"],
                content_url=item.get("contentUrl"),
                created_datetime=item.get("createdDateTime"),
                last_modified_datetime=item.get("lastModifiedDateTime"),
            )
        )

    logger.info(f"Retrieved {len(pages)} pages for section {section_id}")
    return pages


@mcp.tool()
async def search_onenote(
    query: Annotated[str, Field(description="Search query string")],
    access_token: Annotated[str, Field(description="User access token for OBO flow")],
    traceparent: Annotated[
        Optional[str], Field(description="W3C traceparent header")
    ] = None,
    tracestate: Annotated[Optional[str], Field(description="W3C tracestate header")] = None,
) -> list[SearchResult]:
    """
    Search across all OneNote content.

    Args:
        query: Search query string
        access_token: User access token for OBO flow
        traceparent: W3C traceparent header for distributed tracing
        tracestate: Optional W3C tracestate header

    Returns:
        List of search results
    """
    client = await get_graph_client(access_token, traceparent, tracestate)
    result = await client.search(query)

    search_results = []
    for item in result.get("value", []):
        search_results.append(
            SearchResult(
                page_id=item["id"],
                title=item["title"],
                preview=item.get("preview"),
                content_url=item.get("contentUrl"),
            )
        )

    logger.info(f"Found {len(search_results)} results for query: {query}")
    return search_results


@mcp.tool()
async def get_page_content(
    page_id: Annotated[str, Field(description="Page ID")],
    access_token: Annotated[str, Field(description="User access token for OBO flow")],
    traceparent: Annotated[
        Optional[str], Field(description="W3C traceparent header")
    ] = None,
    tracestate: Annotated[Optional[str], Field(description="W3C tracestate header")] = None,
) -> dict[str, str]:
    """
    Get the HTML content of a OneNote page.

    Args:
        page_id: The ID of the page
        access_token: User access token for OBO flow
        traceparent: W3C traceparent header for distributed tracing
        tracestate: Optional W3C tracestate header

    Returns:
        Page content information including HTML content
    """
    client = await get_graph_client(access_token, traceparent, tracestate)
    result = await client.get(f"/me/onenote/pages/{page_id}/content")

    logger.info(f"Retrieved content for page {page_id}")
    return {"page_id": page_id, "content": str(result)}


if __name__ == "__main__":
    logger.info(f"Starting OneNote MCP Server on {settings.host}:{settings.port}")
    mcp.run(transport="http", host=settings.host, port=settings.port)
