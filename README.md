# Glin

로컬 PDF를 요약하고, 각 요약 문장의 원문 근거(page · line · quote)를 확인할 수 있는 서비스입니다.

- `frontend/` : Next.js (Vercel 배포, https://glin.vercel.app)
- `backend/` : FastAPI + SQLAlchemy + Alembic (Render 배포, `render.yaml`)
- `legacy-vite/` : 초기 Figma 기반 UI 시안

## 데이터 구조

```
documents
 └── document_pages
       └── page_lines          (page_id, line_no 유니크: 같은 PDF는 같은 라인 번호)

summary_runs                    (모델 · 옵션 기록으로 재현성 확보)
 ├── summary_run_documents
 └── summary_items
       └── evidences           (page_no, line_start~line_end, quote, score, method, supported)
```

## 로컬 실행

```bash
# 백엔드
cd backend
cp .env.example .env            # DATABASE_URL 등 입력
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# 프론트
cd frontend
cp .env.example .env.local      # NEXT_PUBLIC_API_BASE_URL 확인
npm i && npm run dev
```

## 배포

1. Render에서 이 저장소로 Blueprint(`render.yaml`)를 만들고 `DATABASE_URL`을 입력합니다. 시작 시 `alembic upgrade head`가 테이블을 만듭니다.
2. Vercel 프로젝트 환경변수 `NEXT_PUBLIC_API_BASE_URL`에 Render 서비스 주소를 넣고 다시 배포합니다.
3. 프론트 도메인이 바뀌면 Render의 `ALLOWED_ORIGINS`에 추가합니다.

> 현재 구현 범위: 문서·페이지·라인 조회 API와 요약·근거 데이터 모델. PDF 추출, 요약 생성, 근거 매핑(임베딩 검색 + 재랭킹)은 설계 단계입니다.
