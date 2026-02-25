from fastapi import APIRouter

router = APIRouter(
    prefix="",
    tags=["users"]
)

@router.get("/me")
def get_me():
    return {
        "id": "dev-user-001",
        "name": "Dev User",
        "email": "dev@example.com"
    }