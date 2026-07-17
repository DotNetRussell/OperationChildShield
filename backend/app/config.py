from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    congress_api_key: str = ""
    congress_number: int = 119
    cache_ttl_seconds: int = 86400  # 24 hours
    # Comma-separated exact origins (no wildcards). Prod: public HTTPS only.
    cors_origins: str = "http://localhost:3000"
    congress_base_url: str = "https://api.congress.gov/v3"
    cache_dir: str = "/app/data"

    # Proton / SMTP for Join Us form notifications
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    involve_notify_to: str = ""
    involve_send_auto_reply: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def smtp_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)


settings = Settings()