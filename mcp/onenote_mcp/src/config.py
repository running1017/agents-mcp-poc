"""Configuration management for OneNote MCP Server."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Entra ID Configuration
    tenant_id: str
    client_id: str
    client_secret: str

    # Microsoft Graph API
    graph_api_base_url: str = "https://graph.microsoft.com/v1.0"

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000

    # Required scopes for OBO flow
    obo_scopes: list[str] = [
        "https://graph.microsoft.com/User.Read.All",
        "https://graph.microsoft.com/Group.Read.All",
        "https://graph.microsoft.com/Notes.Read.All",
    ]


settings = Settings()
