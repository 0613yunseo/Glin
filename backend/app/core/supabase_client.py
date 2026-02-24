import os
import requests

SUPABASE_URL = os.getenv("SUPABASE_URL")
ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def test_supabase_connection():
    if not SUPABASE_URL:
        return {"ok": False, "error": "SUPABASE_URL missing"}
    if not ANON_KEY and not SERVICE_KEY:
        return {"ok": False, "error": "No supabase key found (ANON or SERVICE)"}

    # ✅ 추천: 테이블 조회로 연결 확인 (스키마 루트 X)
    table = "documents"  # TODO: documents 같은 실제 테이블명으로 변경
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit=1"

    # 우선순위: service key 있으면 그걸로(권한문제 최소화), 없으면 anon key
    key = SERVICE_KEY or ANON_KEY

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
    }

    r = requests.get(url, headers=headers, timeout=10)

    return {
        "ok": r.ok,
        "status_code": r.status_code,
        "url": url,
        "response": r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text,
    }