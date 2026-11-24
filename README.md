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

## 동작 방식

1. **업로드** `POST /documents/upload` — PDF에서 텍스트를 뽑아 페이지/라인(결정적 번호)으로 저장합니다. 같은 파일(SHA-256)은 같은 문서로 처리합니다. 원본 PDF는 저장하지 않습니다.
2. **요약** `GET/POST /ai/summary` — `GEMINI_API_KEY`가 있으면 Gemini로, 없으면 TF-IDF 중심성 기반 추출식 요약으로 bullet을 만듭니다.
3. **근거 매핑** — 2~4줄 window를 만들고 TF-IDF(글자 bigram 포함) 코사인 유사도로 후보를 검색한 뒤, 핵심어 커버리지로 재랭킹해 page · line · quote를 붙입니다. 같은 입력이면 같은 결과가 나옵니다.

임베딩 모델 + Cross-Encoder 재랭커는 아직 적용하지 않았고, 현재는 위의 어휘 기반 방식입니다. 한계: 스캔 PDF(OCR) 미지원, 업로드 10MB · 80페이지 제한.
