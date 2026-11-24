from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.domains.documents import router as documents_router
from app.domains.users.router import router as users_router

# 모델을 import해 두어야 Alembic이 전체 테이블을 인식한다. (테이블 생성은 `alembic upgrade head`가 담당)
from app.domains.documents import models as _document_models  # noqa: F401
from app.domains.summaries import models as _summary_models  # noqa: F401

from app.core.supabase_client import test_supabase_connection

app = FastAPI(title="Glin Backend")

# 허용 출처: 로컬 개발 + 배포된 프론트. 추가 도메인은 환경변수 ALLOWED_ORIGINS(쉼표 구분)로 넣는다.
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://glin.vercel.app",
]
allowed_origins += [o.strip().rstrip("/") for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router.router)
app.include_router(users_router)


@app.get("/supabase-test")
def supabase_test_endpoint():
    return test_supabase_connection()


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/env-check")
def env_check():
    return {
        "GROQ_API_KEY": bool(os.getenv("GROQ_API_KEY")),
        "GEMINI_API_KEY": bool(os.getenv("GEMINI_API_KEY")),
        "HF_TOKEN": bool(os.getenv("HF_TOKEN")),
        "SUPABASE_URL": bool(os.getenv("SUPABASE_URL")),
        "SUPABASE_ANON_KEY": bool(os.getenv("SUPABASE_ANON_KEY")),
        "SUPABASE_SERVICE_ROLE_KEY": bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY")),
        "DATABASE_URL": bool(os.getenv("DATABASE_URL")),
    }
