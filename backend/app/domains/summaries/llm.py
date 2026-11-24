"""Gemini로 요약 bullet을 만든다. 키가 없거나 호출이 실패하면 None을 돌려주고, 호출한 쪽이 추출식 요약으로 대신한다."""
import json
import os
from typing import List, Optional

import requests

DEFAULT_MODEL = "gemini-flash-lite-latest"
MAX_CHARS = 24000


def model_name() -> str:
    return os.getenv("GEMINI_MODEL", DEFAULT_MODEL)


def llm_available() -> bool:
    return bool(os.getenv("GEMINI_API_KEY"))


def summarize(text: str, n: int, temperature: float) -> Optional[List[str]]:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return None
    prompt = (
        f"다음 문서를 핵심 내용 {n}개의 bullet로 요약하세요.\n"
        "- 문서에 실제로 적힌 내용만 쓰고, 추측이나 외부 지식은 쓰지 마세요.\n"
        "- 각 bullet은 한 문장이며, 원문에 나온 용어와 숫자를 그대로 사용하세요.\n"
        "- 문서와 같은 언어로 쓰세요.\n"
        '- 출력은 JSON 문자열 배열만 (예: ["...", "..."]).\n\n'
        "문서:\n" + text[:MAX_CHARS]
    )
    try:
        resp = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model_name()}:generateContent",
            headers={"x-goog-api-key": key, "Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": temperature, "responseMimeType": "application/json"},
            },
            timeout=25,
        )
        resp.raise_for_status()
        raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        items = json.loads(raw)
        bullets = [str(x).strip() for x in items if str(x).strip()]
        return bullets[:n] or None
    except Exception:
        return None
