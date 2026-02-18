import React, { useState } from "react";
import { useNavigate } from "react-router";
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
  ChevronRight,
  Clock,
} from "lucide-react";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  page_count: number;
  status: "ready" | "processing" | "failed";
  ingested_at: string;
  updated_at: string;
  lines: number;
  size: string;
  category: string;
}

const allDocs: Document[] = [
  {
    id: "1",
    file_name: "딥러닝 기반 자연어 처리 연구 논문.pdf",
    file_path: "/docs/nlp_paper.pdf",
    page_count: 34,
    status: "ready",
    ingested_at: "2026.02.17 14:32",
    updated_at: "2026.02.17",
    lines: 847,
    size: "2.4 MB",
    category: "논문",
  },
  {
    id: "2",
    file_name: "2025 AI 시장 분석 보고서.pdf",
    file_path: "/docs/ai_market.pdf",
    page_count: 58,
    status: "ready",
    ingested_at: "2026.02.15 09:18",
    updated_at: "2026.02.15",
    lines: 1203,
    size: "5.8 MB",
    category: "보고서",
  },
  {
    id: "3",
    file_name: "의료 AI 규제 정책 검토 문서.pdf",
    file_path: "/docs/medical_ai.pdf",
    page_count: 21,
    status: "processing",
    ingested_at: "2026.02.12 16:55",
    updated_at: "2026.02.12",
    lines: 412,
    size: "1.1 MB",
    category: "정책",
  },
  {
    id: "4",
    file_name: "자율주행 기술 동향 보고서 Q4 2025.pdf",
    file_path: "/docs/av_report.pdf",
    page_count: 72,
    status: "ready",
    ingested_at: "2026.02.10 11:20",
    updated_at: "2026.02.10",
    lines: 1844,
    size: "9.2 MB",
    category: "보고서",
  },
  {
    id: "5",
    file_name: "머신러닝 모델 성능 평가 가이드라인.pdf",
    file_path: "/docs/ml_guide.pdf",
    page_count: 16,
    status: "failed",
    ingested_at: "2026.02.07 08:45",
    updated_at: "2026.02.07",
    lines: 0,
    size: "3.3 MB",
    category: "가이드",
  },
  {
    id: "6",
    file_name: "대규모 언어 모델 파인튜닝 실무 가이드.pdf",
    file_path: "/docs/llm_finetune.pdf",
    page_count: 45,
    status: "ready",
    ingested_at: "2026.01.28 17:03",
    updated_at: "2026.01.28",
    lines: 1102,
    size: "4.1 MB",
    category: "가이드",
  },
];

const STATUS_CONFIG: Record<
  Document["status"],
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
};

const CATEGORY_COLORS: Record<string, string> = {
  논문: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  보고서: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  정책: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  가이드: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = allDocs.filter((d) => {
    const matchSearch = d.file_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "전체" ||
      (filterStatus === "준비됨" && d.status === "ready") ||
      (filterStatus === "처리중" && d.status === "processing") ||
      (filterStatus === "오류" && d.status === "failed");
    return matchSearch && matchStatus;
  });

  const readyCount = allDocs.filter((d) => d.status === "ready").length;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground">문서 목록</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            총 {allDocs.length}개 문서 · {readyCount}개 분석 완료
          </p>
        </div>
        <button
          onClick={() => navigate("/upload")}
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
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-medium transition-all min-h-[44px] whitespace-nowrap ${
                filterStatus === s
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
            {[
              { label: "파일명" },
              { label: "페이지 수" },
              { label: "상태" },
              { label: "최종 업데이트" },
              { label: "보기" },
              { label: "" },
            ].map((col, i) => (
              <div
                key={i}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {col.label}
                {col.label && col.label !== "보기" && col.label !== "상태" && (
                  <ArrowUpDown size={10} className="opacity-50" />
                )}
              </div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {filtered.map((doc) => {
                const statusCfg = STATUS_CONFIG[doc.status];
                return (
                  <div
                    key={doc.id}
                    className="grid grid-cols-[2fr_80px_100px_130px_80px_48px] gap-0 px-4 py-3.5 items-center hover:bg-muted/30 cursor-pointer transition-colors group"
                    onClick={() => openMenu !== doc.id && navigate(`/documents/${doc.id}`)}
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
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${CATEGORY_COLORS[doc.category] || ""}`}>
                            {doc.category}
                          </span>
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
                        onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}`); }}
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
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">검색 결과가 없습니다.</p>
          </div>
        ) : (
          filtered.map((doc) => {
            const statusCfg = STATUS_CONFIG[doc.status];
            return (
              <div
                key={doc.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
              >
                {/* Card body */}
                <div className="p-4">
                  {/* File name + status */}
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
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${CATEGORY_COLORS[doc.category] || ""}`}>
                          {doc.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Meta info */}
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

                  {/* Full-width view button */}
                  <button
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white min-h-[48px]"
                    style={{ background: "var(--glin-accent-gradient)" }}
                  >
                    <Eye size={14} />
                    보기
                  </button>
                </div>

                {/* Quick actions bar */}
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
