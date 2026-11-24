"""근거 매핑 엔진 (외부 모델 없이 동작하는 검색 + 재랭킹).

1) 후보 생성: 페이지 안에서 2~4줄짜리 window(span)를 모두 만든다.
2) 검색(Retrieval): window를 TF-IDF 벡터(한글은 글자 bigram 포함)로 만들고, 요약 문장과 코사인 유사도로 top-N 후보를 뽑는다.
3) 재랭킹(Rerank): 후보를 요약 문장의 핵심어 커버리지와 window 길이로 다시 채점해 최종 top-k를 고른다.
같은 입력이면 항상 같은 결과가 나온다. (난수 · 외부 호출 없음)
"""
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Sequence, Tuple

TOKEN_RE = re.compile(r"[a-z0-9]+|[가-힣]+")
WINDOW_SIZES = (2, 3, 4)
RETRIEVE_N = 12
SUPPORT_THRESHOLD = 0.32


def tokenize(text: str) -> List[str]:
    tokens: List[str] = []
    for m in TOKEN_RE.findall(text.lower()):
        if "가" <= m[0] <= "힣":
            tokens.append(m)
            tokens.extend(m[i : i + 2] for i in range(len(m) - 1))
        elif len(m) > 1 or m.isdigit():
            tokens.append(m)
    return tokens


@dataclass
class Window:
    page: int
    start: int  # 1-based line_no
    end: int
    text: str
    counts: Counter = field(default_factory=Counter)

    @property
    def n_lines(self) -> int:
        return self.end - self.start + 1


@dataclass
class Candidate:
    window: Window
    retrieval_score: float
    rerank_score: float = 0.0

    @property
    def supported(self) -> bool:
        return self.rerank_score >= SUPPORT_THRESHOLD


def build_windows(pages: Dict[int, List[str]]) -> List[Window]:
    """pages: {page_no: [line text, ...]}  (line_no = index + 1)"""
    windows: List[Window] = []
    for page_no in sorted(pages):
        lines = pages[page_no]
        if not lines:
            continue
        spans = set()
        for size in WINDOW_SIZES:
            if len(lines) >= size:
                spans.update((i, i + size - 1) for i in range(len(lines) - size + 1))
        if not spans:  # 한 줄짜리 페이지
            spans.add((0, len(lines) - 1))
        for s, e in sorted(spans):
            text = " ".join(lines[s : e + 1])
            windows.append(Window(page_no, s + 1, e + 1, text, Counter(tokenize(text))))
    return windows


class Index:
    def __init__(self, windows: Sequence[Window]):
        self.windows = list(windows)
        df: Counter = Counter()
        for w in self.windows:
            df.update(w.counts.keys())
        n = max(len(self.windows), 1)
        self.idf = {t: math.log((n + 1) / (c + 1)) + 1.0 for t, c in df.items()}
        self.default_idf = math.log(n + 1) + 1.0
        self.postings: Dict[str, List[Tuple[int, float]]] = defaultdict(list)
        for i, w in enumerate(self.windows):
            vec = self._weights(w.counts)
            for t, v in vec.items():
                self.postings[t].append((i, v))

    def _weights(self, counts: Counter) -> Dict[str, float]:
        vec = {t: (1 + math.log(c)) * self.idf.get(t, self.default_idf) for t, c in counts.items()}
        norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
        return {t: v / norm for t, v in vec.items()}

    def retrieve(self, query: str, n: int = RETRIEVE_N) -> List[Candidate]:
        q = self._weights(Counter(tokenize(query)))
        scores: Dict[int, float] = defaultdict(float)
        for t, qv in q.items():
            for i, v in self.postings.get(t, ()):
                scores[i] += qv * v
        ranked = sorted(scores.items(), key=lambda kv: (-kv[1], kv[0]))[:n]
        return [Candidate(self.windows[i], round(s, 4)) for i, s in ranked]

    def rerank(self, query: str, candidates: List[Candidate]) -> List[Candidate]:
        q_terms = set(tokenize(query))
        total = sum(self.idf.get(t, self.default_idf) for t in q_terms) or 1.0
        for c in candidates:
            hit = sum(self.idf.get(t, self.default_idf) for t in q_terms if t in c.window.counts)
            coverage = hit / total
            penalty = 0.03 * (c.window.n_lines - 2)  # 같은 근거면 짧은 구간을 선호
            c.rerank_score = round(max(0.0, min(1.0, 0.5 * c.retrieval_score + 0.5 * coverage - penalty)), 4)
        return sorted(candidates, key=lambda c: (-c.rerank_score, c.window.page, c.window.start))


def pick_evidence(index: Index, query: str, top_k: int) -> List[Candidate]:
    """요약 문장 하나에 대해 서로 겹치지 않는 근거 top_k를 고른다."""
    chosen: List[Candidate] = []
    for cand in index.rerank(query, index.retrieve(query)):
        w = cand.window
        if any(c.window.page == w.page and not (w.end < c.window.start or w.start > c.window.end) for c in chosen):
            continue
        chosen.append(cand)
        if len(chosen) >= top_k:
            break
    return chosen


# ---------- 추출식 요약 (LLM 키가 없을 때 / 실패했을 때) ----------

SENT_SPLIT = re.compile(r"(?<=[.!?。])\s+")


def _units(pages: Dict[int, List[str]]) -> List[str]:
    units: List[str] = []
    for page_no in sorted(pages):
        blob = " ".join(pages[page_no])
        for sent in SENT_SPLIT.split(blob):
            sent = sent.strip()
            if len(sent) <= 180:
                units.append(sent)
                continue
            buf = ""
            for line in pages[page_no]:
                if buf and len(buf) + len(line) > 120:
                    units.append(buf.strip())
                    buf = ""
                buf += " " + line
            if buf.strip():
                units.append(buf.strip())
    return [u for u in units if len(u) >= 12]


def extractive_bullets(index: Index, pages: Dict[int, List[str]], n: int) -> List[str]:
    units = _units(pages)
    if not units:
        return []
    centroid: Counter = Counter()
    for w in index.windows:
        centroid.update(w.counts)
    cvec = index._weights(centroid)

    def vec(u: str) -> Dict[str, float]:
        return index._weights(Counter(tokenize(u)))

    def cos(a: Dict[str, float], b: Dict[str, float]) -> float:
        return sum(v * b.get(t, 0.0) for t, v in a.items())

    scored = []
    for pos, u in enumerate(units):
        v = vec(u)
        scored.append((cos(v, cvec), pos, u, v))
    scored.sort(key=lambda x: (-x[0], x[1]))

    picked: List[Tuple[int, str, Dict[str, float]]] = []
    for _, pos, u, v in scored:
        if any(cos(v, pv) > 0.5 for _, _, pv in picked):
            continue
        picked.append((pos, u, v))
        if len(picked) >= n:
            break
    return [u[:200] for _, u, _ in sorted(picked, key=lambda x: x[0])]
