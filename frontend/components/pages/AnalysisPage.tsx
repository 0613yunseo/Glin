"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { SummaryBullet } from "../summary/SummaryBullet";
import type { SummaryItem } from "../summary/SummaryBullet";
import type { Evidence } from "../evidence/EvidenceCard";
import { EvidenceMappingPipeline } from "../evidence/EvidenceMappingPipeline";
import { QualityMetrics } from "../evidence/QualityMetrics";
import { api, SummaryRun, Line } from "../../lib/api";

// ─── Component ────────────────────────────────────────────────────────────────
export default function AnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docId = searchParams.get("docId");

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryRun, setSummaryRun] = useState<SummaryRun | null>(null);
  const [summaryItems, setSummaryItems] = useState<SummaryItem[]>([]);
  const [viewerLines, setViewerLines] = useState<Line[]>([]);

  // Summary options
  const [style, setStyle] = useState<any>("bullet");
  const [length, setLength] = useState<any>("medium");
  const [bulletCount, setBulletCount] = useState(7);
  const [topK, setTopK] = useState(3);
  const [mode, setMode] = useState<any>("deterministic");
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

  // Initial Fetch
  useEffect(() => {
    if (!docId) {
      setLoading(false);
      setError("문서 ID가 지정되지 않았습니다.");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch summary data
        const data = await api.getSummary(docId);
        setSummaryRun(data.summary_run);
        setSummaryItems(data.items);

        // Fetch first page lines for viewer by default (if available)
        // In a real app, we might fetch lines as needed based on highlightPage.
        const lines = await api.getLines(docId, 1);
        setViewerLines(lines);

      } catch (err: any) {
        console.error("Fetch error:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [docId]);

  // Find active evidence data
  const activeEvidence: Evidence | null = (() => {
    for (const item of summaryItems) {
      const found = item.evidences.find((e) => e.id === activeEvidenceId);
      if (found) return found;
    }
    return null;
  })();

  // When highlightPage changes → fetch those lines
  useEffect(() => {
    if (docId && highlightPage) {
      const fetchNewLines = async () => {
        try {
          const lines = await api.getLines(docId, highlightPage);
          setViewerLines(lines);
        } catch (err) {
          console.error("Failed to fetch viewer lines:", err);
        }
      };
      fetchNewLines();
    }
  }, [docId, highlightPage]);

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
      for (const item of summaryItems) {
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
        }, 300); // Slightly longer wait for potential layout shifts or page loads
        // Fade after 2s
        fadeTimerRef.current = setTimeout(() => {
          setHighlightedLines([]);
          setActiveEvidenceId(null);
        }, 5000); // Wait longer on real data
      }
    },
    [summaryItems]
  );

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  // Export handlers
  const handleExport = (type: string) => {
    setExportOpen(false);
    if (!summaryItems.length) return;

    if (type === "markdown") {
      const md = summaryItems.map(
        (item) => `- ${item.text}`
      ).join("\n");
      navigator.clipboard.writeText(md);
      setCopiedKey("markdown");
      setTimeout(() => setCopiedKey(null), 1800);
      toast.success("Markdown이 클립보드에 복사되었습니다.");
    } else if (type === "json") {
      const json = JSON.stringify({ summary_run: summaryRun, items: summaryItems }, null, 2);
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
    if (!docId) return;
    try {
      setRunning(true);
      const data = await api.rerunSummary(docId, {
        style,
        length,
        summary_bullets: bulletCount,
        evidence_top_k: topK,
        mode
      });
      setSummaryRun(data.summary_run);
      setSummaryItems(data.items);
      toast.success("요약 재실행 완료!");
    } catch (err) {
      toast.error("요약 재실행 중 오류가 발생했습니다.");
    } finally {
      setRunning(false);
    }
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-[var(--glin-accent)] animate-spin" />
        <p className="text-muted-foreground font-medium">분석 결과를 불러오는 중입니다...</p>
      </div>
    );
  }

  // Error state UI
  if (error || !summaryRun) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">{error || "데이터가 없습니다."}</h3>
          <p className="text-sm text-muted-foreground">분석할 문서를 먼저 업로드하거나 선택해 주세요.</p>
        </div>
        <button
          onClick={() => router.push("/documents")}
          className="px-6 py-2.5 rounded-xl bg-[var(--glin-accent)] text-white font-semibold hover:opacity-90 transition-all"
        >
          문서 목록으로 가기
        </button>
      </div>
    );
  }

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
              {summaryRun.document_name}
            </p>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={10} /> {summaryRun.created_at}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Cpu size={10} /> {(summaryRun.latency_ms / 1000).toFixed(1)}s
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {summaryRun.status === "ready" ? "완료" : summaryRun.status}
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
              {summaryRun.document_name}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock size={9} /> {summaryRun.created_at}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Cpu size={9} /> {(summaryRun.latency_ms / 1000).toFixed(1)}s
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {summaryRun.status === "ready" ? "완료" : summaryRun.status}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {summaryRun.mode}
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
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline ${mode === "deterministic"
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
                    {(["bullet", "executive", "study", "action_items"] as any[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all min-h-[36px] ${style === s ? "text-white" : "bg-muted text-muted-foreground hover:text-foreground"
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
                    {(["short", "medium", "long"] as any[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLength(l)}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all min-h-[36px] ${length === l ? "text-white" : "bg-muted text-muted-foreground hover:text-foreground"
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
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all min-h-[36px] ${bulletCount === n ? "text-white" : "bg-muted text-muted-foreground hover:text-foreground"
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
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all min-h-[36px] ${topK === k ? "text-white" : "bg-muted text-muted-foreground hover:text-foreground"
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
                    {(["deterministic", "best_effort"] as any[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[11px] font-semibold transition-all min-h-[36px] ${mode === m
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
                요약 결과 · {summaryItems.length}개 불릿
              </p>
              {activeEvidence && (
                <span className="text-xs text-[var(--glin-accent)] flex items-center gap-1 animate-pulse">
                  <Anchor size={10} /> 원문 하이라이트 활성화
                </span>
              )}
            </div>

            {summaryItems.length === 0 ? (
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-12 text-center text-muted-foreground">
                표시할 요약 내용이 없습니다.
              </div>
            ) : (
              summaryItems.slice(0, bulletCount).map((item, idx) => (
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
              ))
            )}

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
              onClick={() => router.push(`/documents/${summaryRun.document_id}`)}
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
                {summaryRun.document_name}
              </p>
              {viewerLines.length === 0 ? (
                <div className="py-20 text-center text-[10px] text-muted-foreground italic">
                  본문을 불러올 수 없습니다.
                </div>
              ) : (
                viewerLines.map((line) => {
                  const isHighlighted = highlightedLines.includes(line.lineNo);
                  return (
                    <div
                      key={line.lineNo}
                      ref={(el) => {
                        lineRefs.current[line.lineNo] = el;
                      }}
                      className={`flex gap-2 rounded px-1.5 py-0.5 transition-all duration-300 ${isHighlighted
                        ? "bg-[var(--glin-evidence-bg)] border border-[var(--glin-evidence-border)] shadow-sm"
                        : ""
                        }`}
                    >
                      <span
                        className={`flex-shrink-0 text-[10px] w-6 text-right select-none leading-relaxed ${isHighlighted
                          ? "text-[var(--glin-accent)] font-bold"
                          : "text-muted-foreground/40"
                          }`}
                      >
                        {line.lineNo}
                      </span>
                      <span
                        className={`flex-1 leading-relaxed ${isHighlighted ? "text-foreground font-medium" : "text-foreground/70"
                          }`}
                      >
                        {line.text}
                      </span>
                      {isHighlighted && (
                        <Anchor size={9} className="text-[var(--glin-accent)] flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })
              )}
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
