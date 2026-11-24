"""근거 매핑 엔진 기본 동작 확인: pytest backend/tests (DB 불필요)"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.domains.summaries import engine  # noqa: E402

PAGES = {
    1: ["서울시 청년 주거비 부담률을 자치구별로 계산합니다.", "역세권 청년주택의 공실률을 함께 확인합니다.", "데이터 기준일을 화면에 표시합니다."],
    2: ["개인정보는 저장하지 않고 최소화합니다.", "결과는 안정 주의 위험 세 단계로 보여줍니다."],
}


def test_evidence_points_to_matching_lines():
    index = engine.Index(engine.build_windows(PAGES))
    top = engine.pick_evidence(index, "청년주택 공실률을 확인한다", top_k=1)[0]
    assert top.window.page == 1
    assert top.window.start <= 2 <= top.window.end  # 공실률이 있는 줄(2번)을 포함


def test_deterministic_and_non_overlapping():
    index = engine.Index(engine.build_windows(PAGES))
    a = engine.pick_evidence(index, "청년 주거비", top_k=3)
    b = engine.pick_evidence(index, "청년 주거비", top_k=3)
    assert [(c.window.page, c.window.start, c.window.end, c.rerank_score) for c in a] == [
        (c.window.page, c.window.start, c.window.end, c.rerank_score) for c in b
    ]
    spans = [(c.window.page, c.window.start, c.window.end) for c in a]
    for i, x in enumerate(spans):
        for y in spans[i + 1:]:
            assert x[0] != y[0] or x[2] < y[1] or y[2] < x[1]


def test_unrelated_query_is_not_supported():
    index = engine.Index(engine.build_windows(PAGES))
    cands = engine.pick_evidence(index, "quantum chromodynamics lattice", top_k=1)
    assert not cands or not cands[0].supported
