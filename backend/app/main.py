from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.domains.documents import router as documents_router

app = FastAPI(title="Glin Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router.router)

from app.core.supabase_client import test_supabase_connection

@app.get("/supabase-test")
def supabase_test_endpoint():
    return test_supabase_connection()

@app.get("/health")
def health_check():
    return {"status": "ok"}
import os

@app.get("/env-check")
def env_check():
    return {
        "GROQ_API_KEY": bool(os.getenv("GROQ_API_KEY")),
        "GEMINI_API_KEY": bool(os.getenv("GEMINI_API_KEY")),
        "HF_TOKEN": bool(os.getenv("HF_TOKEN")),
        "SUPABASE_URL": bool(os.getenv("SUPABASE_URL")),
        "SUPABASE_ANON_KEY": bool(os.getenv("SUPABASE_ANON_KEY")),
        "SUPABASE_SERVICE_ROLE_KEY": bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY")),
    }