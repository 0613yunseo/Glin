import React, { useState } from "react";
import { ChevronDown, ChevronUp, Database, Cpu, ArrowRight, Layers, Target } from "lucide-react";

interface EvidenceMappingPipelineProps {
  defaultOpen?: boolean;
}

export function EvidenceMappingPipeline({ defaultOpen = false }: EvidenceMappingPipelineProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3.5 hover:bg-muted/50 transition-colors"
      >
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
          style={{ background: "var(--glin-accent-gradient)" }}
        >
          <Layers size={14} />
        </span>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground leading-tight">
            Evidence Mapping Pipeline
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            ML/DL 2-Stage 근거 매핑 파이프라인
          </p>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-[var(--border)]">
          {/* Flow subtitle */}
          <p className="text-[11px] text-muted-foreground text-center mb-4 font-mono">
            Top-K 후보 → 재랭킹 → 최종 evidence 선택
          </p>

          {/* 2-Stage diagram */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            {/* Input */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-[var(--border)] bg-muted/40 sm:w-28 flex-shrink-0">
              <Database size={18} className="text-muted-foreground mb-1.5" />
              <p className="text-[11px] font-semibold text-foreground text-center leading-tight">
                문서 라인 DB
              </p>
              <p className="text-[10px] text-muted-foreground text-center mt-0.5">
                2~4줄 윈도우
              </p>
              <span className="text-[9px] font-mono bg-muted px-1.5 py-0.5 rounded mt-1.5 text-muted-foreground">
                PageLine
              </span>
            </div>

            <div className="hidden sm:flex items-center justify-center text-muted-foreground/40">
              <ArrowRight size={14} />
            </div>
            <div className="sm:hidden flex justify-center text-muted-foreground/40 my-1">
              <ArrowRight size={14} className="rotate-90" />
            </div>

            {/* Stage 1 */}
            <div className="flex-1 rounded-xl border border-[#3b82f6]/40 bg-blue-50 dark:bg-blue-950/20 p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                  Stage 1 · ML
                </span>
              </div>
              <p className="text-xs font-bold text-foreground mb-0.5">Embedding Retrieval</p>
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-2">
                Recall 확보
              </p>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">모델: KR-SBERT</p>
                <p className="text-[10px] text-muted-foreground">ANN 유사도 검색</p>
                <p className="text-[10px] text-muted-foreground">Top-K 후보 스팬 추출</p>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 p-2 rounded-lg bg-blue-100/60 dark:bg-blue-900/30">
                <Cpu size={11} className="text-blue-500" />
                <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">
                  KR-SBERT embedding
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-center text-muted-foreground/40">
              <ArrowRight size={14} />
            </div>
            <div className="sm:hidden flex justify-center text-muted-foreground/40 my-1">
              <ArrowRight size={14} className="rotate-90" />
            </div>

            {/* Stage 2 */}
            <div className="flex-1 rounded-xl border border-purple-400/40 bg-purple-50 dark:bg-purple-950/20 p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400">
                  Stage 2 · DL
                </span>
              </div>
              <p className="text-xs font-bold text-foreground mb-0.5">Cross-Encoder Reranker</p>
              <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mb-2">
                Precision 강화
              </p>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">모델: KoELECTRA</p>
                <p className="text-[10px] text-muted-foreground">Cross-attention 재평가</p>
                <p className="text-[10px] text-muted-foreground">최종 evidence 정렬</p>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 p-2 rounded-lg bg-purple-100/60 dark:bg-purple-900/30">
                <Cpu size={11} className="text-purple-500" />
                <span className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">
                  KoELECTRA reranker
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-center text-muted-foreground/40">
              <ArrowRight size={14} />
            </div>
            <div className="sm:hidden flex justify-center text-muted-foreground/40 my-1">
              <ArrowRight size={14} className="rotate-90" />
            </div>

            {/* Output */}
            <div
              className="flex flex-col items-center justify-center p-3 rounded-xl sm:w-28 flex-shrink-0"
              style={{ background: "var(--glin-accent-gradient)" }}
            >
              <Target size={18} className="text-white mb-1.5" />
              <p className="text-[11px] font-bold text-white text-center leading-tight">
                최종 Evidence
              </p>
              <p className="text-[10px] text-white/70 text-center mt-0.5">선택·고정</p>
              <span className="text-[9px] font-mono bg-white/20 px-1.5 py-0.5 rounded mt-1.5 text-white">
                Evidence
              </span>
            </div>
          </div>

          {/* Candidate span info */}
          <div className="mt-4 p-3 rounded-xl bg-muted/60 border border-[var(--border)]">
            <p className="text-[11px] font-semibold text-foreground mb-2">Candidate Spans 구조</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "윈도우 크기", value: "2~4줄" },
                { label: "검색 후보 K", value: "Top-10" },
                { label: "재랭킹 입력", value: "Top-10 → 3" },
                { label: "최종 evidence", value: "evidence_top_k 개" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-[11px] font-bold text-[var(--glin-accent)]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
