FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml ./

# Install Python dependencies from pyproject.toml
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -e .

# Copy application source
COPY src/ ./src/

# Expose port
EXPOSE 8000

# Run with uvicorn for hot reload support
CMD ["uvicorn", "src.server:mcp.asgi_app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/app/src"]
