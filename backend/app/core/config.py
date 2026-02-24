from pydantic_settings import BaseSettings
from pydantic import ConfigDict, Field


class Settings(BaseSettings):
    # 기존 필드들은 네 프로젝트에 맞춰 유지 (예시)
    DATABASE_URL: str | None = None
    SUPABASE_URL: str | None = None
    SUPABASE_ANON_KEY: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None

    # ✅ 추가: .env에 있는 키 이름(소문자)과 맞추거나 alias로 매핑
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    hf_token: str | None = Field(default=None, alias="HF_TOKEN")

    model_config = ConfigDict(
        env_file=".env",
        extra="ignore",   # ✅ 이거 없으면 또 터짐
        populate_by_name=True
    )


settings = Settings()