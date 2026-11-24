"""PDF -> 페이지별 라인 추출 (결정적).

같은 PDF는 항상 같은 (page, line_no)를 만든다: 페이지 순서 그대로, 줄바꿈 기준으로 나누고
공백만 정리한 뒤 빈 줄을 버리고 1부터 번호를 붙인다. (OCR이 필요한 스캔 PDF는 지원하지 않는다.)
"""
import io
import re
from typing import List

from pypdf import PdfReader

MAX_BYTES = 10 * 1024 * 1024  # Render 무료 메모리를 고려한 업로드 상한
MAX_PAGES = 80


class IngestError(Exception):
    pass


def extract_lines(data: bytes) -> List[List[str]]:
    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            raise IngestError("암호가 걸린 PDF는 처리할 수 없습니다.")
        pages: List[List[str]] = []
        for page in reader.pages[:MAX_PAGES]:
            text = (page.extract_text() or "").replace("\x00", "")
            lines = [re.sub(r"\s+", " ", raw).strip() for raw in text.splitlines()]
            pages.append([line for line in lines if line])
    except IngestError:
        raise
    except Exception as exc:  # pypdf가 던지는 다양한 파싱 오류
        raise IngestError("PDF를 읽을 수 없습니다.") from exc

    if not any(pages):
        raise IngestError("텍스트를 추출할 수 없는 PDF입니다. (스캔본은 지원하지 않습니다.)")
    return pages
