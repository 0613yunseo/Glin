import httpx
from app.core.config import settings

def test_supabase_connection():
    """
    Test connectivity to Supabase REST API checks.
    Uses the anon key to ping the root of the REST API.
    """
    url = f"{settings.SUPABASE_URL}/rest/v1/"
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
    }
    
    try:
        with httpx.Client() as client:
            response = client.get(url, headers=headers)
            return {
                "status_code": response.status_code,
                "url": url,
                "headers_sent": {"apikey": "***"}, # Don't log full key
                "response": response.json() if response.content else "No content"
            }
    except Exception as e:
        return {"error": str(e)}
