import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Sparkles,
  ChevronDown,
  FileText,
  Clock,
  Cpu,
  Download,
  Check,
  Anchor,
  BookOpen,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { SummaryBullet } from "../components/summary/SummaryBullet";
import type { SummaryItem } from "../components/summary/SummaryBullet";
import type { Evidence } from "../components/evidence/EvidenceCard";
import { EvidenceMappingPipeline } from "../components/evidence/EvidenceMappingPipeline";
import { QualityMetrics } from "../components/evidence/QualityMetrics";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SUMMARY_RUN = {
  id: "run_001",
  run_type: "SINGLE" as const,
  document_id: "1",
  document_name: "딥러닝 기반 자연어 처리 연구 논문.pdf",
  style: "bullet" as const,
  length: "medium" as const,
  summary_bullets: 7,
  evidence_top_k: 3,
  mode: "deterministic" as const,
  status: "completed" as const,
  created_at: "2026.02.17 14:55",
  latency_ms: 14520,
};

function makeEvidence(
  id: string,
  summary_item_id: string,
  page_no: number,
  line_start: number,
  line_end: number,
  quote: string,
  score: number,
  retrieval_score: number,
  rerank_score: number,
  supported: boolean
): Evidence {
  return {
    id,
    summary_item_id,
    document_id: "1",
    page_no,
    line_start,
    line_end,
    quote,
    score,
    retrieval_score,
    rerank_score,
    method: "embed+rerank",
    supported,
  };
}

const SUMMARY_ITEMS: SummaryItem[] = [
  {
    id: "si_001",
    item_order: 1,
    text: "KoBERT-CLS 모델이 기존 BiLSTM 기반 분류기 대비 정확도 12.3%, F1-Score 9.8% 향상을 달성하였다.",
    evidences: [
      makeEvidence("ev_001a", "si_001", 4, 97, 99, "KoBERT-CLS 모델은 기존 BiLSTM 대비 정확도 12.3% 향상을 달성하였다. F1-Score 기준으로는 9.8% 향상되었으며, 이는 모든 비교 모델 중 최고 수준이다.", 0.972, 0.841, 0.956, true),
      makeEvidence("ev_001b", "si_001", 1, 7, 8, "기존 BiLSTM 대비 정확도 12.3%, F1-Score 9.8% 향상을 달성하였으며, KorNLI, KorSTS, NSMC, PAWS-X 4종 벤치마크에서 SOTA를 기록했습니다.", 0.891, 0.762, 0.884, true),
      makeEvidence("ev_001c", "si_001", 3, 58, 60, "사전 학습된 KoBERT를 백본으로 사용하며, [CLS] 토큰의 최종 은닉 상태를 분류 헤드에 전달한다.", 0.643, 0.612, 0.634, false),
    ],
  },
  {
    id: "si_002",
    item_order: 2,
    text: "KorNLI, KorSTS, NSMC, PAWS-X 4종의 공개 벤치마크에서 각각 93.2%, 87.4%, 91.8%, 88.6%를 기록하며 SOTA를 달성하였다.",
    evidences: [
      makeEvidence("ev_002a", "si_002", 4, 94, 96, "KorNLI: 93.2%, KorSTS: 87.4%, NSMC: 91.8%, PAWS-X: 88.6%. 4종 벤치마크 모두에서 기존 최고 성능(SOTA)을 달성하였다.", 0.958, 0.881, 0.947, true),
      makeEvidence("ev_002b", "si_002", 1, 8, 8, "KorNLI, KorSTS, NSMC, PAWS-X 4종 벤치마크에서 SOTA를 기록했습니다.", 0.834, 0.721, 0.826, true),
      makeEvidence("ev_002c", "si_002", 4, 92, 92, "Table 1은 기존 모델들과의 상세 비교를 나타낸다.", 0.534, 0.502, 0.521, false),
    ],
  },
  {
    id: "si_003",
    item_order: 3,
    text: "한국어 형태소 분석기 연동으로 OOV(Out-Of-Vocabulary) 비율을 기존 3.7%에서 1.1%로 감소시켰으며, 이는 최종 성능 향상의 주요 요인이다.",
    evidences: [
      makeEvidence("ev_003a", "si_003", 5, 134, 135, "형태소 분석기 연동으로 OOV 비율을 3.7%→1.1%로 감소시켰으며, 이는 최종 성능 향상의 주요 요인으로 분석된다.", 0.934, 0.832, 0.921, true),
      makeEvidence("ev_003b", "si_003", 3, 59, 59, "사전 학습된 KoBERT를 백본으로 사용하며, 형태소 분석기와 연동한 토크나이저를 적용하였다.", 0.712, 0.653, 0.698, true),
    ],
  },
  {
    id: "si_004",
    item_order: 4,
    text: "금융 문서 분류(93.4%), 의료 차트 분석(89.7%), 법률 조항 분류(91.2%) 세 가지 실제 산업 환경에서 유효성을 검증하였다.",
    evidences: [
      makeEvidence("ev_004a", "si_004", 5, 137, 137, "금융 문서 93.4%, 의료 차트 89.7%, 법률 조항 91.2%로 범용성을 입증하였다.", 0.921, 0.812, 0.914, true),
      makeEvidence("ev_004b", "si_004", 1, 6, 6, "본 연구는 BERT 기반 한국어 텍스트 분류 시스템을 제안합니다.", 0.623, 0.571, 0.612, false),
    ],
  },
  {
    id: "si_005",
    item_order: 5,
    text: "학습 데이터셋은 총 48만 건의 한국어 레이블 텍스트로 구성되었으며, 문어체 75%, 구어체 25%의 비율로 분포되어 있다.",
    evidences: [
      makeEvidence("ev_005a", "si_005", 3, 62, 63, "학습률: 2e-5, 배치 크기: 32, 에폭: 10, 옵티마이저: AdamW. 드롭아웃: 0.1, 최대 시퀀스 길이: 512", 0.756, 0.702, 0.749, true),
    ],
  },
  {
    id: "si_006",
    item_order: 6,
    text: "도메인 적응형 파인튜닝 전략을 수립하여 소량 레이블 데이터 환경에서도 안정적인 성능을 보장한다.",
    evidences: [
      makeEvidence("ev_006a", "si_006", 3, 58, 60, "사전 학습된 KoBERT를 백본으로 사용하며, [CLS] 토큰의 최종 은닉 상태를 분류 헤드에 전달한다.", 0.698, 0.612, 0.687, true),
    ],
  },
  {
    id: "si_007",
    item_order: 7,
    text: "본 연구의 핵심 기여는 3가지로 요약된다: 토크나이저 개선, 도메인 적응형 파인튜닝, 데이터 증강 기법 제안.",
    evidences: [
      makeEvidence("ev_007a", "si_007", 5, 133, 133, "본 연구에서는 KoBERT 기반 한국어 텍스트 분류 모델을 제안하였다.", 0.812, 0.734, 0.804, true),
      makeEvidence("ev_007b", "si_007", 1, 5, 8, "본 연구는 BERT 기반 한국어 텍스트 분류 시스템을 제안합니다. 기존 BiLSTM 대비 정확도 12.3%, F1-Score 9.8% 향상을 달성하였으며, 4종 벤치마크에서 SOTA를 기록했습니다.", 0.778, 0.698, 0.765, true),
    ],
  },
];

// ─── Viewer mock lines ─────────────────────────────────────────────────────────
const VIEWER_LINES: Record<number, { lineNo: number; text: string }[]> = {
  1: [
    { lineNo: 1, text: "딥러닝 기반 자연어 처리 연구" },
    { lineNo: 5, text: "【초록】" },
    { lineNo: 6, text: "본 연구는 BERT 기반 한국어 텍스트 분류 시스템을 제안합니다." },
    { lineNo: 7, text: "기존 BiLSTM 대비 정확도 12.3%, F1-Score 9.8% 향상을 달성하였으며," },
    { lineNo: 8, text: "KorNLI, KorSTS, NSMC, PAWS-X 4종 벤치마크에서 SOTA를 기록했습니다." },
  ],
  3: [
    { lineNo: 57, text: "3.1 모델 구조 및 학습 전략" },
    { lineNo: 58, text: "제안하는 모델의 전체 아키텍처는 Fig. 2와 같다." },
    { lineNo: 59, text: "사전 학습된 KoBERT를 백본으로 사용하며," },
    { lineNo: 60, text: "[CLS] 토큰의 최종 은닉 상태를 분류 헤드에 전달한다." },
    { lineNo: 62, text: "학습률: 2e-5, 배치 크기: 32, 에폭: 10" },
    { lineNo: 63, text: "드롭아웃: 0.1, 최대 시퀀스 길이: 512" },
  ],
  4: [
    { lineNo: 89, text: "4. 실험 결과" },
    { lineNo: 92, text: "Table 1은 기존 모델들과의 상세 비교를 나타낸다." },
    { lineNo: 94, text: "KorNLI: 93.2%, KorSTS: 87.4%, NSMC: 91.8%, PAWS-X: 88.6%" },
    { lineNo: 95, text: "4종 벤치마크 모두에서 기존 최고 성능(SOTA)을 달성하였다." },
    { lineNo: 97, text: "KoBERT-CLS 모델은 기존 BiLSTM 대비 정확도 12.3% 향상을 달성하였다." },
    { lineNo: 98, text: "F1-Score 기준으로는 9.8% 향상되었으며," },
  ],
  5: [
    { lineNo: 131, text: "5. 결론" },
    { lineNo: 133, text: "본 연구에서는 KoBERT 기반 한국어 텍스트 분류 모델을 제안하였다." },
    { lineNo: 134, text: "형태소 분석기 연동으로 OOV 비율을 3.7%→1.1%로 감소시켰으며," },
    { lineNo: 135, text: "이는 최종 성능 향상의 주요 요인으로 분석된다." },
    { lineNo: 137, text: "금융 문서 93.4%, 의료 차트 89.7%, 법률 조항 91.2%로 범용성을 입증하였다." },
  ],
};

// ─── Options types ────────────────────────────────────────────────────────────
type SummaryStyle = "bullet" | "executive" | "study" | "action_items";
type SummaryLength = "short" | "medium" | "long";
type SummaryMode = "deterministic" | "best_effort";

// ─── Component ────────────────────────────────────────────────────────────────
export default function AnalysisPage() {
  const navigate = useNavigate();

  // Summary options
  const [style, setStyle] = useState<SummaryStyle>("bullet");
  const [length, setLength] = useState<SummaryLength>("medium");
  const [bulletCount, setBulletCount] = useState(7);
  const [topK, setTopK] = useState(3);
  const [mode, setMode] = useState<SummaryMode>("deterministic");
  const [optionsOpen, setOptionsOpen] = useState(false);

  // Active evidence for line highlight
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);
  const [highlightPage, setHighlightPage] = useState<number | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Re-run state
  const [running, setRunning] = useState(false);

  // Find active evidence data
  const activeEvidence: Evidence | null = (() => {
    for (const item of SUMMARY_ITEMS) {
      const found = item.evidences.find((e) => e.id === activeEvidenceId);
      if (found) return found;
    }
    return null;
  })();

  // When evidence activates → highlight lines
  const handleEvidenceActivate = useCallback(
    (evidenceId: string | null) => {
      setActiveEvidenceId(evidenceId);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (!evidenceId) {
        setHighlightedLines([]);
        setHighlightPage(null);
        return;
      }
      // Find evidence
      let ev: Evidence | null = null;
      for (const item of SUMMARY_ITEMS) {
        const found = item.evidences.find((e) => e.id === evidenceId);
        if (found) { ev = found; break; }
      }
      if (ev) {
        const lines: number[] = [];
        for (let l = ev.line_start; l <= ev.line_end; l++) lines.push(l);
        setHighlightedLines(lines);
        setHighlightPage(ev.page_no);
        // Scroll to first line in viewer
        setTimeout(() => {
          const firstLine = lines[0];
          if (firstLine && lineRefs.current[firstLine]) {
            lineRefs.current[firstLine]?.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 50);
        // Fade after 2s
        fadeTimerRef.current = setTimeout(() => {
          setHighlightedLines([]);
          setActiveEvidenceId(null);
        }, 2000);
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  // Export handlers
  const handleExport = (type: string) => {
    setExportOpen(false);
    if (type === "markdown") {
      const md = SUMMARY_ITEMS.map(
        (item) => `- ${item.text}`
      ).join("\n");
      navigator.clipboard.writeText(md);
      setCopiedKey("markdown");
      setTimeout(() => setCopiedKey(null), 1800);
      toast.success("Markdown이 클립보드에 복사되었습니다.");
    } else if (type === "json") {
      const json = JSON.stringify({ summary_run: MOCK_SUMMARY_RUN, items: SUMMARY_ITEMS }, null, 2);
      navigator.clipboard.writeText(json);
      setCopiedKey("json");
      setTimeout(() => setCopiedKey(null), 1800);
      toast.success("JSON이 클립보드에 복사되었습니다.");
    } else if (type === "google") {
      toast.info("Google Docs 내보내기 (연동 준비 중)");
    } else if (type === "notion") {
      toast.info("Notion 내보내기 (연동 준비 중)");
    }
  };

  const handleRerun = async () => {
    setRunning(true);
    await new Promise((r) => setTimeout(r, 1800));
    setRunning(false);
    toast.success("요약 재실행 완료!");
  };

  // Viewer lines to display (all pages' lines merged, filtered by highlight page)
  const viewerLines = (() => {
    const allLines: { lineNo: number; text: string }[] = [];
    Object.values(VIEWER_LINES).forEach((lines) => allLines.push(...lines));
    allLines.sort((a, b) => a.lineNo - b.lineNo);
    return allLines;
  })();

  return (
    <div className="flex flex-col md:h-full md:overflow-hidden">
      {/* ── Page header: Mobile stacked, Desktop row ── */}
      
      {/* Mobile header */}
      <div className="md:hidden flex-shrink-0 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 space-y-3">
        {/* Doc info */}
        <div className="flex items-start gap-2">
          <Sparkles size={14} className="text-[var(--glin-accent)] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">
              {MOCK_SUMMARY_RUN.document_name}
            </p>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={10} /> {MOCK_SUMMARY_RUN.created_at}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Cpu size={10} /> {(MOCK_SUMMARY_RUN.latency_ms / 1000).toFixed(1)}s
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                완료
              </span>
            </div>
          </div>
        </div>
        {/* Action buttons — full width */}
        <div className="flex gap-2">
          <button
            onClick={handleRerun}
            disabled={running}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-[var(--border)] bg-[var(--card)] text-foreground hover:bg-muted transition-all disabled:opacity-50 min-h-[48px]"
          >
            {running ? (
              <span className="w-4 h-4 rounded-full border-2 border-[var(--glin-accent)] border-t-transparent animate-spin" />
            ) : (
              <Sparkles size={14} className="text-[var(--glin-accent)]" />
            )}
            {running ? "실행 중..." : "요약 재실행"}
          </button>

          <div className="flex-1 relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white min-h-[48px]"
              style={{ background: "var(--glin-accent-gradient)" }}
            >
              <Download size={14} />
              내보내기
              <ChevronDown size={12} className={`transition-transform ${exportOpen ? "rotate-180" : ""}`} />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                <div className="absolute left-0 right-0 top-full mt-2 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xl z-50 overflow-hidden py-1">
                  <p className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-[var(--border)]">
                    내보내기 옵션
                  </p>
                  {[
                    { key: "google", label: "Google Docs로 내보내기", icon: "📄" },
                    { key: "notion", label: "Notion으로 내보내기", icon: "📝" },
                    { key: "markdown", label: "Markdown 복사", icon: "⌨️" },
                    { key: "json", label: "JSON 복사", icon: "{ }" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleExport(item.key)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-foreground hover:bg-muted transition-colors text-left min-h-[48px]"
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                      {copiedKey === item.key && (
                        <Check size={13} className="ml-auto text-green-500" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:flex flex-shrink-0 px-4 md:px-6 py-3.5 border-b border-[var(--border)] bg-[var(--card)] items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--glin-accent)] flex-shrink-0" />
            <p className="text-sm font-semibold text-foreground truncate">
              {MOCK_SUMMARY_RUN.document_name}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock size={9} /> {MOCK_SUMMARY_RUN.created_at}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Cpu size={9} /> {(MOCK_SUMMARY_RUN.latency_ms / 1000).toFixed(1)}s
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              완료
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {MOCK_SUMMARY_RUN.mode}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleRerun}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--card)] text-foreground hover:bg-muted transition-all disabled:opacity-50"
          >
            {running ? (
              <span className="w-3 h-3 rounded-full border-2 border-[var(--glin-accent)] border-t-transparent animate-spin" />
            ) : (
              <Sparkles size={12} className="text-[var(--glin-accent)]" />
            )}
            {running ? "실행 중..." : "요약 재실행"}
          </button>

          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
              style={{ background: "var(--glin-accent-gradient)" }}
            >
              <Download size={12} />
              내보내기
              <ChevronDown size={11} className={`transition-transform ${exportOpen ? "rotate-180" : ""}`} />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xl z-50 overflow-hidden py-1">
                  <p className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-[var(--border)]">
                    내보내기 옵션
                  </p>
                  {[
                    { key: "google", label: "Google Docs로 내보내기", icon: "📄" },
                    { key: "notion", label: "Notion으로 내보내기", icon: "📝" },
                    { key: "markdown", label: "Markdown 복사", icon: "⌨️" },
                    { key: "json", label: "JSON 복사", icon: "{ }" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleExport(item.key)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <span className="text-sm">{item.icon}</span>
                      {item.label}
                      {copiedKey === item.key && (
                        <Check size={11} className="ml-auto text-green-500" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden overflow-y-auto">
        {/* Left: Summary options + bullets */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Summary options card */}
          <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--card)]">
            <button
              onClick={() => setOptionsOpen((v) => !v)}
              className="w-full flex items-center gap-2.5 px-4 py-3.5 hover:bg-muted/50 transition-colors min-h-[52px]"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex-1 text-left">
                요약 옵션
              </span>
              <div className="flex items-center gap-2 mr-2">
                <span className="text-xs font-medium text-[var(--glin-accent)]">
                  {style === "bullet" ? "불릿" : style === "executive" ? "경영요약" : style === "study" ? "학습용" : "액션아이템"}{" "}
                  / {length === "short" ? "짧게" : length === "medium" ? "중간" : "길게"}{" "}
                  / {bulletCount}불릿
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline ${
                    mode === "deterministic"
                      ? "bg-[var(--glin-accent-light)] text-[var(--glin-accent)]"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {mode}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-muted-foreground flex-shrink-0 transition-transform ${optionsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {optionsOpen && (
              <div className="border-t border-[var(--border)] px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Style */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    스타일
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(["bullet", "executive", "study", "action_items"] as SummaryStyle[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all min-h-[36px] ${
                          style === s ? "text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                        style={style === s ? { background: "var(--glin-accent-gradient)" } : {}}
                      >
                        {s === "bullet" ? "불릿" : s === "executive" ? "경영요약" : s === "study" ? "학습용" : "액션아이템"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Length */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    길이
                  </label>
                  <div className="flex gap-2">
                    {(["short", "medium", "long"] as SummaryLength[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLength(l)}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all min-h-[36px] ${
                          length === l ? "text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                        style={length === l ? { background: "var(--glin-accent-gradient)" } : {}}
                      >
                        {l === "short" ? "짧게" : l === "medium" ? "중간" : "길게"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bullets count */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    불릿 수
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[5, 6, 7, 8, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => setBulletCount(n)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all min-h-[36px] ${
                          bulletCount === n ? "text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                        style={bulletCount === n ? { background: "var(--glin-accent-gradient)" } : {}}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* evidence_top_k */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    근거 수 (top-k)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((k) => (
                      <button
                        key={k}
                        onClick={() => setTopK(k)}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all min-h-[36px] ${
                          topK === k ? "text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                        style={topK === k ? { background: "var(--glin-accent-gradient)" } : {}}
                      >
                        top-{k}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    모드
                  </label>
                  <div className="flex items-center gap-2 p-1 rounded-xl bg-muted w-full sm:w-fit">
                    {(["deterministic", "best_effort"] as SummaryMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[11px] font-semibold transition-all min-h-[36px] ${
                          mode === m
                            ? "bg-[var(--card)] text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary bullets accordion */}
          <div className="md:flex-1 md:overflow-y-auto px-4 py-4 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                요약 결과 · {SUMMARY_ITEMS.length}개 불릿
              </p>
              {activeEvidence && (
                <span className="text-xs text-[var(--glin-accent)] flex items-center gap-1 animate-pulse">
                  <Anchor size={10} /> 원문 하이라이트 활성화
                </span>
              )}
            </div>

            {SUMMARY_ITEMS.slice(0, bulletCount).map((item, idx) => (
              <SummaryBullet
                key={item.id}
                item={{
                  ...item,
                  evidences: item.evidences.slice(0, topK),
                }}
                activeEvidenceId={activeEvidenceId}
                onEvidenceActivate={handleEvidenceActivate}
                defaultOpen={idx === 0}
              />
            ))}

            {/* Mobile: Quality + Pipeline below bullets */}
            <div className="lg:hidden space-y-4 pt-2 border-t border-[var(--border)] mt-2">
              <QualityMetrics precision3={0.847} evidenceCoverage={0.923} unsupportedRate={0.143} totalBullets={bulletCount} />
              <EvidenceMappingPipeline />
            </div>
          </div>
        </div>

        {/* Right panel: Viewer + Metrics + Pipeline (desktop only) */}
        <div className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-[var(--border)] overflow-hidden flex-shrink-0">
          {/* Viewer header */}
          <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--card)] px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BookOpen size={13} className="text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">원문 뷰어</span>
            </div>
            <button
              onClick={() => navigate(`/documents/${MOCK_SUMMARY_RUN.document_id}`)}
              className="flex items-center gap-1 text-[10px] text-[var(--glin-accent)] hover:underline"
            >
              <ZoomIn size={10} />
              상세 보기
            </button>
          </div>

          {/* Line viewer */}
          <div className="flex-1 overflow-y-auto px-3 py-3 font-mono text-xs bg-[var(--card)]">
            <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-white dark:bg-[#1a2236] p-3">
              <p className="text-[10px] font-bold text-muted-foreground text-center mb-3 pb-2 border-b border-[var(--border)]">
                {MOCK_SUMMARY_RUN.document_name}
              </p>
              {viewerLines.map((line) => {
                const isHighlighted = highlightedLines.includes(line.lineNo);
                return (
                  <div
                    key={line.lineNo}
                    ref={(el) => {
                      lineRefs.current[line.lineNo] = el;
                    }}
                    className={`flex gap-2 rounded px-1.5 py-0.5 transition-all duration-300 ${
                      isHighlighted
                        ? "bg-[var(--glin-evidence-bg)] border border-[var(--glin-evidence-border)] shadow-sm"
                        : ""
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 text-[10px] w-6 text-right select-none leading-relaxed ${
                        isHighlighted
                          ? "text-[var(--glin-accent)] font-bold"
                          : "text-muted-foreground/40"
                      }`}
                    >
                      {line.lineNo}
                    </span>
                    <span
                      className={`flex-1 leading-relaxed ${
                        isHighlighted ? "text-foreground font-medium" : "text-foreground/70"
                      }`}
                    >
                      {line.text}
                    </span>
                    {isHighlighted && (
                      <Anchor size={9} className="text-[var(--glin-accent)] flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                );
              })}
              {!activeEvidence && (
                <p className="text-[10px] text-muted-foreground/50 text-center mt-3 pt-2 border-t border-[var(--border)]">
                  근거 카드를 클릭하면 해당 줄이 하이라이트됩니다
                </p>
              )}
            </div>
          </div>

          {/* Quality Metrics */}
          <div className="flex-shrink-0 border-t border-[var(--border)] p-3">
            <QualityMetrics
              precision3={0.847}
              evidenceCoverage={0.923}
              unsupportedRate={0.143}
              totalBullets={bulletCount}
            />
          </div>

          {/* Evidence Mapping Pipeline */}
          <div className="flex-shrink-0 border-t border-[var(--border)] p-3">
            <EvidenceMappingPipeline />
          </div>
        </div>
      </div>
    </div>
  );
}