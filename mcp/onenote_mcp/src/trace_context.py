"""W3C Trace Context utilities for distributed tracing."""

import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

# W3C Trace Context header names
TRACEPARENT_HEADER = "traceparent"
TRACESTATE_HEADER = "tracestate"

# Traceparent format: version-trace_id-parent_id-trace_flags
# Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
TRACEPARENT_PATTERN = re.compile(
    r"^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$"
)


class TraceContext:
    """W3C Trace Context implementation for distributed tracing."""

    def __init__(
        self,
        trace_id: Optional[str] = None,
        parent_id: Optional[str] = None,
        trace_flags: str = "01",
    ):
        """
        Initialize trace context.

        Args:
            trace_id: 32-char hex string representing the trace ID
            parent_id: 16-char hex string representing the parent span ID
            trace_flags: 2-char hex string for trace flags (01 = sampled)
        """
        self.version = "00"
        self.trace_id = trace_id
        self.parent_id = parent_id
        self.trace_flags = trace_flags
        self.tracestate: Optional[str] = None

    @classmethod
    def from_headers(cls, headers: dict[str, str]) -> Optional["TraceContext"]:
        """
        Parse W3C Trace Context from HTTP headers.

        Args:
            headers: Dictionary of HTTP headers

        Returns:
            TraceContext instance or None if headers are invalid
        """
        traceparent = headers.get(TRACEPARENT_HEADER) or headers.get(
            TRACEPARENT_HEADER.title()
        )

        if not traceparent:
            logger.debug("No traceparent header found")
            return None

        match = TRACEPARENT_PATTERN.match(traceparent)
        if not match:
            logger.warning(f"Invalid traceparent format: {traceparent}")
            return None

        version, trace_id, parent_id, trace_flags = match.groups()

        if version != "00":
            logger.warning(f"Unsupported traceparent version: {version}")
            return None

        context = cls(
            trace_id=trace_id,
            parent_id=parent_id,
            trace_flags=trace_flags,
        )

        # Optional tracestate header
        tracestate = headers.get(TRACESTATE_HEADER) or headers.get(
            TRACESTATE_HEADER.title()
        )
        if tracestate:
            context.tracestate = tracestate

        logger.info(f"Parsed trace context: trace_id={trace_id}, parent_id={parent_id}")
        return context

    def to_headers(self) -> dict[str, str]:
        """
        Convert trace context to HTTP headers.

        Returns:
            Dictionary of HTTP headers for W3C Trace Context
        """
        if not self.trace_id or not self.parent_id:
            return {}

        headers = {
            TRACEPARENT_HEADER: f"{self.version}-{self.trace_id}-{self.parent_id}-{self.trace_flags}"
        }

        if self.tracestate:
            headers[TRACESTATE_HEADER] = self.tracestate

        return headers

    def __str__(self) -> str:
        """String representation of trace context."""
        return f"TraceContext(trace_id={self.trace_id}, parent_id={self.parent_id})"
