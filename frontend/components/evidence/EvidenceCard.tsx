import React from "react";
import { Anchor, FileText, Quote, ChevronDown, ChevronUp } from "lucide-react";

export interface Evidence {
  id: string;
  summary_item_id: string;
  document_id: string;
  page_no: number;
  line_start: number;
  line_end: number;
  quote: string;
  score: number;
  method: "embed+rerank" | "embed" | "rerank";
  supported: boolean;
  retrieval_score?: number;
  rerank_score?: number;
}

interface EvidenceCardProps {
  evidence: Evidence;
  isActive: boolean;
  onActivate: () => void;
  index?: number;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score * 100}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono font-semibold text-muted-foreground min-w-[2.5rem] text-right">
        {score.toFixed(3)}
      </span>
    </div>
  );
}

export function EvidenceCard({ evidence: ev, isActive, onActivate, index = 0 }: EvidenceCardProps) {
  return (
    <button
      onClick={onActivate}
      className={`w-full text-left rounded-xl border transition-all duration-200 overflow-hidden ${
        isActive
          ? "border-[var(--glin-accent)] bg-[var(--glin-evidence-bg)] shadow-md"
          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--glin-accent)]/50 hover:shadow-sm"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        {/* Page + Line range */}
        <span
          className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg font-mono tracking-wide transition-colors ${
            isActive
              ? "bg-[var(--glin-accent)] text-white"
              : "bg-[var(--glin-accent-light)] text-[var(--glin-accent)]"
          }`}
        >
          <FileText size={10} />
          p.{ev.page_no} · L.{ev.line_start}–{ev.line_end}
        </span>

        {/* Method badge */}
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          {ev.method}
        </span>

        {/* Supported badge */}
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto flex-shrink-0 ${
            ev.supported
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {ev.supported ? "✓ 지지됨" : "✗ 미지지"}
        </span>

        {isActive ? (
          <ChevronUp size={13} className="text-[var(--glin-accent)] flex-shrink-0 ml-1" />
        ) : (
          <ChevronDown size={13} className="text-muted-foreground flex-shrink-0 ml-1" />
        )}
      </div>

      {/* Quote */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-start gap-2">
          <Quote size={13} className="text-[var(--glin-accent)] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed italic line-clamp-2">
            {ev.quote}
          </p>
        </div>

        {/* Scores — always show overall score, show detailed if active */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">최종 점수</span>
          </div>
          <ScoreBar score={ev.score} color="var(--glin-accent-gradient)" />

          {isActive && ev.retrieval_score !== undefined && ev.rerank_score !== undefined && (
            <>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[var(--border)]">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">① 임베딩 검색</span>
                  <ScoreBar score={ev.retrieval_score} color="#60a5fa" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">② 리랭커 점수</span>
                  <ScoreBar score={ev.rerank_score} color="#a78bfa" />
                </div>
              </div>
              <p className="text-[10px] text-[var(--glin-accent)] flex items-center gap-1 mt-1">
                <Anchor size={9} />
                원문 라인 하이라이트 활성화됨
              </p>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
