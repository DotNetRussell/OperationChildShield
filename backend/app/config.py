from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    congress_api_key: str = ""
    congress_number: int = 119
    cache_ttl_seconds: int = 86400  # 24 hours
    cors_origins: str = "http://localhost:3000"
    congress_base_url: str = "https://api.congress.gov/v3"
    cache_dir: str = "/app/data"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()