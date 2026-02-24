"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Upload,
  MoreHorizontal,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  Eye,
  Clock,
} from "lucide-react";
import { api, DocMeta } from "../../lib/api";

/**
 * 명확한 타입 정의 (any 사용 금지)
 */
interface DocumentListItem {
  id: string;
  file_name: string;
  page_count: number;
  status: "ready" | "processing" | "failed" | "error"; // "error"도 포함 (가정 준수)
  updated_at: string;
  lines: number;
  size: string;
}

const STATUS_CONFIG: Record<
  DocumentListItem["status"],
  { icon: React.ReactNode; label: string; bg: string; text: string }
> = {
  ready: {
    icon: <CheckCircle2 size={11} />,
    label: "준비됨",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
  },
  processing: {
    icon: <Loader2 size={11} className="animate-spin" />,
    label: "처리중",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
  },
  failed: {
    icon: <AlertCircle size={11} />,
    label: "오류",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
  },
  error: {
    icon: <AlertCircle size={11} />,
    label: "오류",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
  },
};

export default function DocumentsPage() {
  const router = useRouter();

  // Data State
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data: DocMeta[] = await api.getDocuments();

        // API 결과를 DocumentListItem 형식으로 매핑
        const mappedDocs: DocumentListItem[] = data.map((d) => ({
          id: d.id,
          file_name: d.file_name,
          page_count: d.page_count,
          status: (d.status === "failed" ? "error" : d.status) || "ready",
          updated_at: d.ingested_at || "-",
          lines: d.lines || 0,
          size: d.size || "0 KB",
        }));

        setDocuments(mappedDocs);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        setError("문서 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const matchSearch = d.file_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === "전체" ||
        (filterStatus === "준비됨" && d.status === "ready") ||
        (filterStatus === "처리중" && d.status === "processing") ||
        (filterStatus === "오류" && (d.status === "failed" || d.status === "error"));
      return matchSearch && matchStatus;
    });
  }, [documents, search, filterStatus]);

  const stats = useMemo(() => {
    const ready = documents.filter((d) => d.status === "ready").length;
    return { total: documents.length, ready };
  }, [documents]);

  // Loading Skeleton Component
  const SkeletonRow = () => (
    <div className="grid grid-cols-[2fr_80px_100px_130px_80px_48px] gap-0 px-4 py-4 items-center animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
      </div>
      <div className="h-4 w-8 bg-muted rounded" />
      <div className="h-6 w-16 bg-muted rounded-lg" />
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="h-8 w-14 bg-muted rounded-lg" />
      <div className="ml-auto h-4 w-4 bg-muted rounded" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground">문서 목록</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            총 {stats.total}개 문서 · {stats.ready}개 분석 완료
          </p>
        </div>
        <button
          onClick={() => router.push("/upload")}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white min-h-[48px] sm:min-h-0 sm:py-2.5"
          style={{ background: "var(--glin-accent-gradient)" }}
        >
          <Upload size={15} />
          새 문서 업로드
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="파일명으로 검색..."
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--glin-accent)] transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {["전체", "준비됨", "처리중", "오류"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-medium transition-all min-h-[44px] whitespace-nowrap ${filterStatus === s
                ? "text-white shadow-sm"
                : "bg-[var(--card)] border border-[var(--border)] text-muted-foreground hover:text-foreground"
                }`}
              style={filterStatus === s ? { background: "var(--glin-accent-gradient)" } : {}}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table — desktop only */}
      <div className="hidden md:block">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="grid grid-cols-[2fr_80px_100px_130px_80px_48px] gap-0 border-b border-[var(--border)] px-4 py-2.5 bg-muted/50">
            {["파일명", "페이지 수", "상태", "최종 업데이트", "보기", ""].map((label, i) => (
              <div
                key={i}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {label}
                {label && label !== "보기" && label !== "상태" && label !== "" && (
                  <ArrowUpDown size={10} className="opacity-50" />
                )}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="divide-y divide-[var(--border)]">
              {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {error ? (
                <>
                  <AlertCircle size={36} className="mx-auto mb-3 text-red-400" />
                  <p className="text-sm font-medium text-red-500">{error}</p>
                </>
              ) : (
                <>
                  <FileText size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">검색 결과가 없습니다.</p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {filtered.map((doc) => {
                const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.ready;
                return (
                  <div
                    key={doc.id}
                    className="grid grid-cols-[2fr_80px_100px_130px_80px_48px] gap-0 px-4 py-3.5 items-center hover:bg-muted/30 cursor-pointer transition-colors group"
                    onClick={() => openMenu !== doc.id && router.push(`/documents/${doc.id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--glin-accent-light)" }}
                      >
                        <FileText size={14} className="text-[var(--glin-accent)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-[var(--glin-accent)] transition-colors">
                          {doc.file_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doc.lines > 0 && (
                            <span className="text-[10px] text-muted-foreground">{doc.lines.toLocaleString()}줄</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{doc.size}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">{doc.page_count}p</div>

                    <div>
                      <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg w-fit ${statusCfg.bg} ${statusCfg.text}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">{doc.updated_at}</div>

                    <div>
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/documents/${doc.id}`); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--glin-accent-light)] text-[var(--glin-accent)] hover:opacity-80 transition-opacity"
                      >
                        <Eye size={11} />
                        보기
                      </button>
                    </div>

                    <div className="flex justify-end relative">
                      <button
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === doc.id ? null : doc.id); }}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      {openMenu === doc.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }} />
                          <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-lg z-20 overflow-hidden py-1">
                            <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left">
                              <Download size={12} className="text-muted-foreground" /> 요약 다운로드
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left">
                              <RefreshCw size={12} className="text-muted-foreground" /> 재처리
                            </button>
                            <div className="border-t border-[var(--border)] mt-1 pt-1">
                              <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left">
                                <Trash2 size={12} /> 삭제
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-4">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
              <div className="h-10 w-full bg-muted rounded-xl" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {error ? (
              <>
                <AlertCircle size={36} className="mx-auto mb-3 text-red-400" />
                <p className="text-sm font-medium text-red-500">{error}</p>
              </>
            ) : (
              <>
                <FileText size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">검색 결과가 없습니다.</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((doc) => {
            const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.ready;
            return (
              <div
                key={doc.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "var(--glin-accent-light)" }}
                    >
                      <FileText size={18} className="text-[var(--glin-accent)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug mb-1.5">
                        {doc.file_name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap mb-4 pl-[52px]">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={11} /> {doc.updated_at}
                    </span>
                    <span className="text-xs text-muted-foreground">{doc.page_count}페이지</span>
                    {doc.lines > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {doc.lines.toLocaleString()}줄
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{doc.size}</span>
                  </div>

                  <button
                    onClick={() => router.push(`/documents/${doc.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white min-h-[48px]"
                    style={{ background: "var(--glin-accent-gradient)" }}
                  >
                    <Eye size={14} />
                    보기
                  </button>
                </div>

                <div className="border-t border-[var(--border)] flex divide-x divide-[var(--border)]">
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px]">
                    <Download size={13} /> 다운로드
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px]">
                    <RefreshCw size={13} /> 재처리
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-[44px]">
                    <Trash2 size={13} /> 삭제
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
