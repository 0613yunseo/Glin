import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  Sparkles,
  RefreshCw,
  BookOpen,
  ZoomIn,
  ZoomOut,
  ChevronLeft as PagePrev,
  ChevronRight as PageNext,
  Anchor,
  AlignLeft,
  FileText,
} from "lucide-react";
import { ExtractionStatus } from "../components/documents/ExtractionStatus";
import type { ExtractionStepKey, StepStatus } from "../components/documents/ExtractionStatus";

// Mock document metadata
const MOCK_DOC = {
  id: "1",
  file_name: "딥러닝 기반 자연어 처리 연구 논문.pdf",
  file_path: "/docs/nlp_paper.pdf",
  page_count: 34,
  status: "ready" as const,
  ingested_at: "2026.02.17 14:32",
  updated_at: "2026.02.17",
  lines: 847,
  size: "2.4 MB",
};

const EXTRACTION_STATUS: Partial<Record<ExtractionStepKey, StepStatus>> = {
  extracted: "done",
  line_built: "done",
  window_built: "done",
  embedding_indexed: "done",
};

const MOCK_PAGES = [
  { pageNo: 1, title: "1. 서론", lineStart: 1, lineEnd: 25 },
  { pageNo: 2, title: "2. 관련 연구", lineStart: 26, lineEnd: 54 },
  { pageNo: 3, title: "3. 방법론", lineStart: 55, lineEnd: 88 },
  { pageNo: 4, title: "4. 실험 결과", lineStart: 89, lineEnd: 130 },
  { pageNo: 5, title: "5. 결론", lineStart: 131, lineEnd: 155 },
];

const MOCK_LINES: Record<number, { lineNo: number; text: string; hasAnchor?: boolean }[]> = {
  1: [
    { lineNo: 1, text: "딥러닝 기반 자연어 처리 연구" },
    { lineNo: 2, text: "김철수¹, 이영희², 박민수¹" },
    { lineNo: 3, text: "¹서울대학교 AI연구소  ²카이스트" },
    { lineNo: 4, text: "" },
    { lineNo: 5, text: "【초록】" },
    { lineNo: 6, text: "본 연구는 BERT 기반 한국어 텍스트 분류 시스템을 제안합니다." },
    { lineNo: 7, text: "기존 BiLSTM 대비 정확도 12.3%, F1-Score 9.8% 향상을 달성하였으며," },
    { lineNo: 8, text: "KorNLI, KorSTS, NSMC, PAWS-X 4종 벤치마크에서 SOTA를 기록했습니다." },
    { lineNo: 9, text: "" },
    { lineNo: 10, text: "키워드: BERT, KoBERT, 텍스트 분류, 한국어 NLP, 파인튜닝" },
  ],
  2: [
    { lineNo: 26, text: "2. 관련 연구" },
    { lineNo: 27, text: "" },
    { lineNo: 28, text: "2.1 사전 학습 언어 모델" },
    { lineNo: 29, text: "Devlin et al.(2019)의 BERT는 양방향 트랜스포머 구조를 기반으로" },
    { lineNo: 30, text: "대규모 비지도 학습을 수행한 사전 학습 모델이다." },
    { lineNo: 31, text: "" },
    { lineNo: 32, text: "2.2 한국어 NLP 모델 현황" },
    { lineNo: 33, text: "KoBERT(SKT)는 한국어 위키피디아 기반 사전 학습 모델로," },
    { lineNo: 34, text: "한국어 자연어 이해 태스크에서 우수한 성능을 보인다." },
  ],
  3: [
    { lineNo: 55, text: "3. 방법론" },
    { lineNo: 56, text: "" },
    { lineNo: 57, text: "3.1 모델 구조 및 학습 전략" },
    { lineNo: 58, text: "제안하는 모델의 전체 아키텍처는 Fig. 2와 같다." },
    { lineNo: 59, text: "사전 학습된 KoBERT를 백본으로 사용하며," },
    { lineNo: 60, text: "[CLS] 토큰의 최종 은닉 상태를 분류 헤드에 전달한다." },
    { lineNo: 61, text: "" },
    { lineNo: 62, text: "학습률: 2e-5, 배치 크기: 32, 에폭: 10, 옵티마이저: AdamW" },
    { lineNo: 63, text: "드롭아웃: 0.1, 최대 시퀀스 길이: 512" },
  ],
  4: [
    { lineNo: 89, text: "4. 실험 결과" },
    { lineNo: 90, text: "" },
    { lineNo: 91, text: "4.1 벤치마크 성능 비교" },
    { lineNo: 92, text: "Table 1은 기존 모델들과의 상세 비교를 나타낸다." },
    { lineNo: 93, text: "" },
    { lineNo: 94, text: "KorNLI: 93.2%, KorSTS: 87.4%, NSMC: 91.8%, PAWS-X: 88.6%", hasAnchor: true },
    { lineNo: 95, text: "4종 벤치마크 모두에서 기존 최고 성능(SOTA)을 달성하였다.", hasAnchor: true },
    { lineNo: 96, text: "" },
    { lineNo: 97, text: "KoBERT-CLS 모델은 기존 BiLSTM 대비 정확도 12.3% 향상을 달성하였다.", hasAnchor: true },
    { lineNo: 98, text: "F1-Score 기준으로는 9.8% 향상되었으며," },
    { lineNo: 99, text: "이는 모든 비교 모델 중 최고 수준이다." },
  ],
  5: [
    { lineNo: 131, text: "5. 결론" },
    { lineNo: 132, text: "" },
    { lineNo: 133, text: "본 연구에서는 KoBERT 기반 한국어 텍스트 분류 모델을 제안하였다." },
    { lineNo: 134, text: "형태소 분석기 연동으로 OOV 비율을 3.7%→1.1%로 감소시켰으며,", hasAnchor: true },
    { lineNo: 135, text: "이는 최종 성능 향상의 주요 요인으로 분석된다.", hasAnchor: true },
    { lineNo: 136, text: "" },
    { lineNo: 137, text: "금융 문서 93.4%, 의료 차트 89.7%, 법률 조항 91.2%로 범용성을 입증하였다.", hasAnchor: true },
  ],
};

export default function DocumentDetailPage() {
  const { docId } = useParams();
  const navigate = useNavigate();

  const doc = MOCK_DOC;

  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);
  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<"lines" | "pdf">("lines");

  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const lineListRef = useRef<HTMLDivElement>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPageData = MOCK_PAGES.find((p) => p.pageNo === currentPage);
  const currentLines = MOCK_LINES[currentPage] || [];

  const highlightLines = useCallback((lineNums: number[]) => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    setHighlightedLines(lineNums);
    const firstLine = lineNums[0];
    if (firstLine && lineRefs.current[firstLine]) {
      lineRefs.current[firstLine]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    fadeTimerRef.current = setTimeout(() => {
      setHighlightedLines([]);
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  // Shared PDF mock content
  const PdfMockContent = () => (
    <div className="rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
      <div
        className="bg-white dark:bg-[#1a2236] px-6 md:px-8 py-5 md:py-6 min-h-[380px]"
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
      >
        <div className="text-center mb-5 pb-4 border-b border-gray-100 dark:border-gray-700/50">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
            딥러닝 기반 자연어 처리 연구
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            김철수¹ · 이영희² · 박민수¹
          </p>
        </div>

        {currentPageData && (
          <div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">
              {currentPageData.title}
            </p>
            <div className="space-y-2">
              {currentLines
                .filter((l) => l.text)
                .slice(0, 8)
                .map((line) => (
                  <div
                    key={line.lineNo}
                    className={`flex gap-3 rounded px-2 py-0.5 transition-all duration-300 ${
                      highlightedLines.includes(line.lineNo)
                        ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                        : ""
                    }`}
                  >
                    <span className="text-[9px] text-gray-300 dark:text-gray-600 font-mono w-4 flex-shrink-0 text-right mt-0.5">
                      {line.lineNo}
                    </span>
                    <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                      {line.text}
                    </p>
                  </div>
                ))}
              {currentLines.filter((l) => l.text).length > 8 && (
                <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center pt-2">
                  ⋯ {currentLines.filter((l) => l.text).length - 8}줄 더
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700/50 flex justify-between">
          <span className="text-[9px] text-gray-400 dark:text-gray-600">
            GLIN 분석용 — 로컬 처리
          </span>
          <span className="text-[9px] text-gray-400 dark:text-gray-600">
            {currentPage} / {doc.page_count}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* ── Mobile sub-header ── */}
      <div
        className="md:hidden flex items-center gap-2 px-3 border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0"
        style={{ height: 52 }}
      >
        <button
          onClick={() => navigate("/documents")}
          className="flex items-center justify-center w-11 h-11 -ml-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <ChevronLeft size={22} />
        </button>
        <p className="flex-1 text-sm font-semibold text-foreground truncate min-w-0">
          {doc.file_name}
        </p>
        <button
          className="flex items-center justify-center w-11 h-11 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          title="재처리"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── Desktop sub-header ── */}
      <div className="hidden md:flex px-4 md:px-6 py-3 border-b border-[var(--border)] bg-[var(--card)] items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate("/documents")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={14} /> 문서 목록
        </button>
        <span className="text-muted-foreground/40 text-xs">/</span>
        <span className="text-xs text-foreground font-medium truncate max-w-[180px] sm:max-w-xs">
          {doc.file_name}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {doc.page_count}페이지 · {doc.lines.toLocaleString()}줄
          </span>
          <button
            onClick={() => navigate("/analysis")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
            style={{ background: "var(--glin-accent-gradient)" }}
          >
            <Sparkles size={12} />
            요약 실행
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--card)] text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <RefreshCw size={12} />
            재처리
          </button>
        </div>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="flex flex-col flex-1 md:hidden overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0">
          {(["lines", "pdf"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors border-b-2 min-h-[48px] ${
                mobileTab === tab
                  ? "text-[var(--glin-accent)] border-[var(--glin-accent)] bg-[var(--glin-accent-light)]/30"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {tab === "lines" ? (
                <><AlignLeft size={15} /> 라인 보기</>
              ) : (
                <><FileText size={15} /> PDF 보기</>
              )}
            </button>
          ))}
        </div>

        {/* Page dropdown selector */}
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--card)] flex items-center gap-3 flex-shrink-0">
          <AlignLeft size={14} className="text-muted-foreground flex-shrink-0" />
          <div className="flex-1 relative">
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-[var(--border)] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--glin-accent)] transition-all appearance-none pr-8 min-h-[44px]"
            >
              {MOCK_PAGES.map((p) => (
                <option key={p.pageNo} value={p.pageNo}>
                  {p.pageNo}페이지 — {p.title}
                </option>
              ))}
            </select>
            <ChevronLeft size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] text-muted-foreground pointer-events-none" />
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0 font-mono">
            {currentPage}/{doc.page_count}
          </span>
        </div>

        {/* Tab content */}
        {mobileTab === "lines" ? (
          <div
            ref={lineListRef}
            className="flex-1 overflow-y-auto px-4 py-3 font-mono"
          >
            {currentLines.map((line) => {
              const isHighlighted = highlightedLines.includes(line.lineNo);
              return (
                <div
                  key={line.lineNo}
                  ref={(el) => { lineRefs.current[line.lineNo] = el; }}
                  className={`flex gap-3 rounded-lg px-2 py-2 transition-all duration-300 ${
                    isHighlighted
                      ? "bg-[var(--glin-evidence-bg)] border border-[var(--glin-evidence-border)] shadow-sm"
                      : ""
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-8 text-right select-none text-xs leading-relaxed pt-0.5 ${
                      isHighlighted
                        ? "text-[var(--glin-accent)] font-bold"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    {line.text ? line.lineNo : ""}
                  </span>
                  <span
                    className={`flex-1 text-sm leading-relaxed ${
                      isHighlighted ? "text-foreground font-medium" : "text-foreground/80"
                    }`}
                  >
                    {line.text}
                  </span>
                  {line.hasAnchor && (
                    <Anchor
                      size={11}
                      className={`flex-shrink-0 mt-1.5 transition-colors ${
                        isHighlighted
                          ? "text-[var(--glin-accent)]"
                          : "text-muted-foreground/25"
                      }`}
                    />
                  )}
                </div>
              );
            })}
            {currentPage === MOCK_PAGES.length && (
              <div className="text-center py-6 text-xs text-muted-foreground/40">
                ⋯ 이하 생략
              </div>
            )}

            {/* Test highlight hint */}
            <div className="mx-0 mt-4 rounded-xl border border-[var(--glin-evidence-border)] bg-[var(--glin-evidence-bg)] p-3.5">
              <p className="text-xs text-[var(--glin-accent)] font-medium mb-1.5">
                💡 라인 하이라이트 사용 방법
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                요약 분석 페이지에서 근거(Evidence) 카드를 클릭하면 해당 라인이 자동으로 하이라이트됩니다.
              </p>
              <button
                onClick={() => { setCurrentPage(4); highlightLines([94, 95, 97]); }}
                className="text-xs text-[var(--glin-accent)] hover:underline font-medium"
              >
                → 테스트: 4페이지 L.94–97 하이라이트
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Zoom controls */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <BookOpen size={14} className="text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">PDF 미리보기</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom((z) => Math.max(60, z - 10))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-xs text-muted-foreground font-mono w-10 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(150, z + 10))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>

            <PdfMockContent />
            <ExtractionStatus statuses={EXTRACTION_STATUS} />
          </div>
        )}

        {/* ── Sticky bottom: 요약 실행 ── */}
        <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--card)] px-4 py-3 safe-area-pb">
          <button
            onClick={() => navigate("/analysis")}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white min-h-[52px]"
            style={{ background: "var(--glin-accent-gradient)" }}
          >
            <Sparkles size={16} />
            요약 실행
          </button>
        </div>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left Panel: Page selector + line list */}
        <div className="flex flex-col w-[42%] lg:w-[38%] border-r border-[var(--border)] overflow-hidden bg-[var(--card)]">
          {/* Page selector */}
          <div className="flex-shrink-0 border-b border-[var(--border)] px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlignLeft size={12} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">페이지 선택</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {currentPage}/{doc.page_count}
              </span>
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {MOCK_PAGES.map((p) => (
                <button
                  key={p.pageNo}
                  onClick={() => setCurrentPage(p.pageNo)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    currentPage === p.pageNo
                      ? "text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  style={currentPage === p.pageNo ? { background: "var(--glin-accent-gradient)" } : {}}
                >
                  {p.pageNo}
                </button>
              ))}
              {doc.page_count > 5 && (
                <span className="flex-shrink-0 px-2 py-1 text-[11px] text-muted-foreground">
                  ···
                </span>
              )}
            </div>
            {currentPageData && (
              <p className="text-[11px] text-muted-foreground truncate">{currentPageData.title}</p>
            )}
          </div>

          {/* Line list */}
          <div ref={lineListRef} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs">
            {currentLines.map((line) => {
              const isHighlighted = highlightedLines.includes(line.lineNo);
              return (
                <div
                  key={line.lineNo}
                  ref={(el) => { lineRefs.current[line.lineNo] = el; }}
                  className={`flex gap-2.5 group rounded px-1.5 py-0.5 transition-all duration-300 ${
                    isHighlighted
                      ? "bg-[var(--glin-evidence-bg)] border border-[var(--glin-evidence-border)] shadow-sm"
                      : ""
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-7 text-right select-none text-[10px] leading-relaxed ${
                      isHighlighted ? "text-[var(--glin-accent)] font-bold" : "text-muted-foreground/40"
                    }`}
                  >
                    {line.text ? line.lineNo : ""}
                  </span>
                  <span
                    className={`flex-1 leading-relaxed ${
                      isHighlighted ? "text-foreground font-medium" : "text-foreground/80"
                    }`}
                  >
                    {line.text}
                  </span>
                  {line.hasAnchor && (
                    <Anchor
                      size={9}
                      className={`flex-shrink-0 mt-1 transition-colors ${
                        isHighlighted
                          ? "text-[var(--glin-accent)]"
                          : "text-muted-foreground/25 group-hover:text-[var(--glin-accent)]/50"
                      }`}
                    />
                  )}
                </div>
              );
            })}
            {currentPage === MOCK_PAGES.length && (
              <div className="text-center py-4 text-[10px] text-muted-foreground/40">
                ⋯ 이하 생략
              </div>
            )}
          </div>

          {/* Page nav */}
          <div className="flex-shrink-0 border-t border-[var(--border)] px-3 py-2 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <PagePrev size={13} /> 이전
            </button>
            <span className="text-[11px] text-muted-foreground">
              {currentPage} / {doc.page_count}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(MOCK_PAGES.length, p + 1))}
              disabled={currentPage === MOCK_PAGES.length}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              다음 <PageNext size={13} />
            </button>
          </div>
        </div>

        {/* Right Panel: PDF preview + ExtractionStatus */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* PDF toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen size={13} className="text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">PDF 미리보기</span>
              <span className="text-[10px] text-muted-foreground font-mono">— p.{currentPage}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(60, z - 10))}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-[11px] text-muted-foreground font-mono w-10 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(150, z + 10))}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <ZoomIn size={13} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div
              className="rounded-xl border border-[var(--border)] shadow-sm overflow-hidden transition-all duration-300"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                marginBottom: zoom > 100 ? `${(zoom - 100) * 2.5}px` : "0",
              }}
            >
              <div className="bg-white dark:bg-[#1a2236] px-8 py-6 min-h-[420px]">
                <div className="text-center mb-6 pb-5 border-b border-gray-100 dark:border-gray-700/50">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                    딥러닝 기반 자연어 처리 연구
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    김철수¹ · 이영희² · 박민수¹
                  </p>
                </div>

                {currentPageData && (
                  <div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">
                      {currentPageData.title}
                    </p>
                    <div className="space-y-2">
                      {currentLines
                        .filter((l) => l.text)
                        .slice(0, 8)
                        .map((line) => (
                          <div
                            key={line.lineNo}
                            className={`flex gap-3 rounded px-2 py-0.5 transition-all duration-300 ${
                              highlightedLines.includes(line.lineNo)
                                ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                                : ""
                            }`}
                          >
                            <span className="text-[9px] text-gray-300 dark:text-gray-600 font-mono w-4 flex-shrink-0 text-right mt-0.5">
                              {line.lineNo}
                            </span>
                            <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                              {line.text}
                            </p>
                          </div>
                        ))}
                      {currentLines.filter((l) => l.text).length > 8 && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center pt-2">
                          ⋯ {currentLines.filter((l) => l.text).length - 8}줄 더
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700/50 flex justify-between">
                  <span className="text-[9px] text-gray-400 dark:text-gray-600">GLIN 분석용 — 로컬 처리</span>
                  <span className="text-[9px] text-gray-400 dark:text-gray-600">{currentPage} / {doc.page_count}</span>
                </div>
              </div>
            </div>

            <ExtractionStatus statuses={EXTRACTION_STATUS} />

            <div className="rounded-xl border border-[var(--glin-evidence-border)] bg-[var(--glin-evidence-bg)] p-3">
              <p className="text-xs text-[var(--glin-accent)] font-medium mb-1">
                💡 라인 하이라이트 사용 방법
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                요약 분석 페이지에서 근거(Evidence) 카드를 클릭하면, 이 뷰어의 해당 라인이 자동으로 하이라이트됩니다.
              </p>
              <button
                onClick={() => highlightLines([94, 95, 97])}
                className="mt-2 text-[11px] text-[var(--glin-accent)] hover:underline"
              >
                → 테스트: 4페이지 L.94–97 하이라이트
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
