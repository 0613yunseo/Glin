"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ExtractionStatus } from "../documents/ExtractionStatus";
import type { ExtractionStepKey, StepStatus } from "../documents/ExtractionStatus";
import { api, DocMeta, PageMeta, Line } from "../../lib/api";

export default function DocumentDetailPage() {
  const { docId } = useParams() as { docId: string };
  const router = useRouter();

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<DocMeta | null>(null);
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [currentLines, setCurrentLines] = useState<Line[]>([]);

  // UI states
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);
  const [mobileTab, setMobileTab] = useState<"lines" | "pdf">("lines");

  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const lineListRef = useRef<HTMLDivElement>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial Fetch: Doc metadata and Pages
  useEffect(() => {
    if (!docId) return;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [docData, pagesData] = await Promise.all([
          api.getDocument(docId),
          api.getPages(docId),
        ]);
        setDoc(docData);
        setPages(pagesData);

        // If there are pages, the first page lines will be fetched by the other useEffect
      } catch (err) {
        console.error("Failed to fetch document data:", err);
        setError("문서 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [docId]);

  // Fetch Lines when page changes
  useEffect(() => {
    if (!docId || !currentPage) return;

    const fetchLines = async () => {
      try {
        const lines = await api.getLines(docId, currentPage);
        setCurrentLines(lines);
      } catch (err) {
        console.error("Failed to fetch lines:", err);
        // Don't set global error to avoid hiding the whole UI, maybe just a toast
      }
    };

    fetchLines();
  }, [docId, currentPage]);

  const currentPageData = pages.find((p) => p.pageNo === currentPage);

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

  // Mock extraction status for now, or derive from doc
  const extractionStatuses: Partial<Record<ExtractionStepKey, StepStatus>> = {
    extracted: "done",
    line_built: "done",
    window_built: "done",
    embedding_indexed: "done",
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-[var(--glin-accent)] animate-spin" />
        <p className="text-muted-foreground font-medium">문서를 불러오는 중입니다...</p>
      </div>
    );
  }

  // Error state UI
  if (error || !doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">{error || "문서를 찾을 수 없습니다."}</h3>
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
    <div className="h-full flex flex-col">
      {/* ── Mobile sub-header ── */}
      <div
        className="md:hidden flex items-center gap-2 px-3 border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0"
        style={{ height: 52 }}
      >
        <button
          onClick={() => router.push("/documents")}
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
          onClick={() => router.push("/documents")}
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
            onClick={() => router.push(`/analysis?docId=${doc.id}`)}
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
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors border-b-2 min-h-[48px] ${mobileTab === tab
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
              {pages.map((p) => (
                <option key={p.pageNo} value={p.pageNo}>
                  {p.pageNo}페이지 {p.title ? `— ${p.title}` : ""}
                </option>
              ))}
              {pages.length === 0 && <option value={1}>1페이지</option>}
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
            {currentLines.length === 0 ? (
              <div className="py-20 text-center text-xs text-muted-foreground italic">
                라인 데이터를 불러오는 중이거나 데이터가 없습니다.
              </div>
            ) : (
              currentLines.map((line) => {
                const isHighlighted = highlightedLines.includes(line.lineNo);
                return (
                  <div
                    key={line.lineNo}
                    ref={(el) => { lineRefs.current[line.lineNo] = el; }}
                    className={`flex gap-3 rounded-lg px-2 py-2 transition-all duration-300 ${isHighlighted
                      ? "bg-[var(--glin-evidence-bg)] border border-[var(--glin-evidence-border)] shadow-sm"
                      : ""
                      }`}
                  >
                    <span
                      className={`flex-shrink-0 w-8 text-right select-none text-xs leading-relaxed pt-0.5 ${isHighlighted
                        ? "text-[var(--glin-accent)] font-bold"
                        : "text-muted-foreground/40"
                        }`}
                    >
                      {line.text ? line.lineNo : ""}
                    </span>
                    <span
                      className={`flex-1 text-sm leading-relaxed ${isHighlighted ? "text-foreground font-medium" : "text-foreground/80"
                        }`}
                    >
                      {line.text}
                    </span>
                    {line.hasAnchor && (
                      <Anchor
                        size={11}
                        className={`flex-shrink-0 mt-1.5 transition-colors ${isHighlighted
                          ? "text-[var(--glin-accent)]"
                          : "text-muted-foreground/25"
                          }`}
                      />
                    )}
                  </div>
                );
              })
            )}

            {/* Test highlight hint */}
            <div className="mx-0 mt-4 rounded-xl border border-[var(--glin-evidence-border)] bg-[var(--glin-evidence-bg)] p-3.5">
              <p className="text-xs text-[var(--glin-accent)] font-medium mb-1.5">
                💡 라인 하이라이트 사용 방법
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                요약 분석 페이지에서 근거(Evidence) 카드를 클릭하면 해당 라인이 자동으로 하이라이트됩니다.
              </p>
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

            <ExtractionStatus statuses={extractionStatuses} />
          </div>
        )}

        {/* ── Sticky bottom: 요약 실행 ── */}
        <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--card)] px-4 py-3 safe-area-pb">
          <button
            onClick={() => router.push(`/analysis?docId=${doc.id}`)}
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
              {pages.map((p) => (
                <button
                  key={p.pageNo}
                  onClick={() => setCurrentPage(p.pageNo)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${currentPage === p.pageNo
                    ? "text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  style={currentPage === p.pageNo ? { background: "var(--glin-accent-gradient)" } : {}}
                >
                  {p.pageNo}
                </button>
              ))}
              {pages.length === 0 && (
                <button
                  onClick={() => setCurrentPage(1)}
                  className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium text-white"
                  style={{ background: "var(--glin-accent-gradient)" }}
                >
                  1
                </button>
              )}
            </div>
            {currentPageData && (
              <p className="text-[11px] text-muted-foreground truncate">{currentPageData.title}</p>
            )}
          </div>

          {/* Line list */}
          <div ref={lineListRef} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs">
            {currentLines.length === 0 ? (
              <div className="py-20 text-center text-[10px] text-muted-foreground italic">
                라인 데이터를 불러오는 중입니다...
              </div>
            ) : (
              currentLines.map((line) => {
                const isHighlighted = highlightedLines.includes(line.lineNo);
                return (
                  <div
                    key={line.lineNo}
                    ref={(el) => { lineRefs.current[line.lineNo] = el; }}
                    className={`flex gap-2.5 group rounded px-1.5 py-0.5 transition-all duration-300 ${isHighlighted
                      ? "bg-[var(--glin-evidence-bg)] border border-[var(--glin-evidence-border)] shadow-sm"
                      : ""
                      }`}
                  >
                    <span
                      className={`flex-shrink-0 w-7 text-right select-none text-[10px] leading-relaxed ${isHighlighted ? "text-[var(--glin-accent)] font-bold" : "text-muted-foreground/40"
                        }`}
                    >
                      {line.text ? line.lineNo : ""}
                    </span>
                    <span
                      className={`flex-1 leading-relaxed ${isHighlighted ? "text-foreground font-medium" : "text-foreground/80"
                        }`}
                    >
                      {line.text}
                    </span>
                    {line.hasAnchor && (
                      <Anchor
                        size={9}
                        className={`flex-shrink-0 mt-1 transition-colors ${isHighlighted
                          ? "text-[var(--glin-accent)]"
                          : "text-muted-foreground/25 group-hover:text-[var(--glin-accent)]/50"
                          }`}
                      />
                    )}
                  </div>
                );
              })
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
              onClick={() => setCurrentPage((p) => Math.min(doc.page_count, p + 1))}
              disabled={currentPage === doc.page_count}
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
                    {doc.file_name}
                  </p>
                </div>

                {currentPageData ? (
                  <div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">
                      {currentPageData.title}
                    </p>
                    <div className="space-y-2">
                      {currentLines
                        .filter((l) => l.text)
                        .slice(0, 15)
                        .map((line) => (
                          <div
                            key={line.lineNo}
                            className={`flex gap-3 rounded px-2 py-0.5 transition-all duration-300 ${highlightedLines.includes(line.lineNo)
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
                      {currentLines.filter((l) => l.text).length > 15 && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center pt-2">
                          ⋯ {currentLines.filter((l) => l.text).length - 15}줄 더
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-xs text-muted-foreground italic">
                    페이지 내용을 표시할 수 없습니다.
                  </div>
                )}

                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700/50 flex justify-between">
                  <span className="text-[9px] text-gray-400 dark:text-gray-600">GLIN 분석용 — 로컬 처리</span>
                  <span className="text-[9px] text-gray-400 dark:text-gray-600">{currentPage} / {doc.page_count}</span>
                </div>
              </div>
            </div>

            <ExtractionStatus statuses={extractionStatuses} />

            <div className="rounded-xl border border-[var(--glin-evidence-border)] bg-[var(--glin-evidence-bg)] p-3">
              <p className="text-xs text-[var(--glin-accent)] font-medium mb-1">
                💡 라인 하이라이트 사용 방법
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                요약 분석 페이지에서 근거(Evidence) 카드를 클릭하면, 이 뷰어의 해당 라인이 자동으로 하이라이트됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
