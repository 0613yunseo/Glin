from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.domains.documents import router as documents_router
from app.domains.users.router import router as users_router

# ✅ DB Base / Engine
from app.core.database import Base, engine

# ✅ 모델 import를 강제로 한 번 해줘야 create_all이 테이블을 만든다.
# (import만 하면 됨. lint용 noqa)
from app.domains.documents.models import Document  # noqa: F401

from app.core.supabase_client import test_supabase_connection

app = FastAPI(title="Glin Backend")

# ✅ 운영 환경 CORS (일단 최소한으로 안전하게)
# - localhost는 개발용
# - 배포 프론트 도메인이 있으면 여기에 추가해야 함
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # TODO: 프론트 배포 도메인 생기면 추가
    # "https://<your-frontend-domain>"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 라우터
app.include_router(documents_router.router)
app.include_router(users_router)

# ✅ 서버 시작 시 테이블 자동 생성 (Render 신규 DB에 documents 테이블 생성)
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

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
        "DATABASE_URL": bool(os.getenv("DATABASE_URL")),  # ✅ 추가(중요)
    }