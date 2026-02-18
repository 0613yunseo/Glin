import React from "react";
import { CheckCircle2, Loader2, Circle } from "lucide-react";

export type ExtractionStepKey =
  | "extracted"
  | "line_built"
  | "window_built"
  | "embedding_indexed";

export type StepStatus = "done" | "loading" | "pending";

const STEPS: { key: ExtractionStepKey; label: string; desc: string; tech: string }[] = [
  {
    key: "extracted",
    label: "텍스트 추출",
    desc: "PDF → 원시 텍스트 변환 완료",
    tech: "PyMuPDF",
  },
  {
    key: "line_built",
    label: "라인 인덱스 생성",
    desc: "줄 번호(line_no) 매핑 완료",
    tech: "PageLine",
  },
  {
    key: "window_built",
    label: "윈도우 구성",
    desc: "2~4줄 슬라이딩 윈도우 스팬 생성",
    tech: "Candidate Spans",
  },
  {
    key: "embedding_indexed",
    label: "임베딩 인덱스",
    desc: "KR-SBERT 벡터 인덱스 완료",
    tech: "FAISS / ANN",
  },
];

interface ExtractionStatusProps {
  statuses: Partial<Record<ExtractionStepKey, StepStatus>>;
  compact?: boolean;
}

export function ExtractionStatus({ statuses, compact = false }: ExtractionStatusProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      {!compact && (
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Ingest Pipeline
          </span>
        </div>
      )}
      <div className={compact ? "flex flex-wrap gap-2 p-3" : "divide-y divide-[var(--border)]"}>
        {STEPS.map((step) => {
          const status = statuses[step.key] ?? "pending";
          if (compact) {
            return (
              <div
                key={step.key}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
                  status === "done"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : status === "loading"
                    ? "bg-[var(--glin-accent-light)] text-[var(--glin-accent)]"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {status === "done" ? (
                  <CheckCircle2 size={11} />
                ) : status === "loading" ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Circle size={11} />
                )}
                {step.label}
              </div>
            );
          }
          return (
            <div key={step.key} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-shrink-0 w-5 flex items-center justify-center">
                {status === "done" ? (
                  <CheckCircle2 size={16} className="text-green-500" />
                ) : status === "loading" ? (
                  <Loader2 size={16} className="text-[var(--glin-accent)] animate-spin" />
                ) : (
                  <Circle size={16} className="text-muted-foreground/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-xs font-semibold ${
                      status === "pending" ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                    {step.tech}
                  </span>
                </div>
                {status !== "pending" && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{step.desc}</p>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  status === "done"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : status === "loading"
                    ? "bg-[var(--glin-accent-light)] text-[var(--glin-accent)]"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {status === "done" ? "완료" : status === "loading" ? "처리중" : "대기"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
