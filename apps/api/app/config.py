from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    max_upload_mb: int = 15
    model_provider: str = "none"
    model_base_url: str | None = None
    model_api_key: str | None = None
    model_name: str | None = None
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    cors_origins: str = "http://localhost:3000"   # comma-separated list in production

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

