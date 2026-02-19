import React, { useState } from "react";
import { ChevronDown, ChevronUp, Anchor } from "lucide-react";
import { EvidenceCard, Evidence } from "../evidence/EvidenceCard";

export interface SummaryItem {
  id: string;
  item_order: number;
  text: string;
  evidences: Evidence[];
}

interface SummaryBulletProps {
  item: SummaryItem;
  activeEvidenceId: string | null;
  onEvidenceActivate: (evidenceId: string | null) => void;
  defaultOpen?: boolean;
}

export function SummaryBullet({
  item,
  activeEvidenceId,
  onEvidenceActivate,
  defaultOpen = false,
}: SummaryBulletProps) {
  const [open, setOpen] = useState(defaultOpen);

  const activeCount = item.evidences.filter((e) => e.supported).length;
  const hasActiveEvidence = item.evidences.some((e) => activeEvidenceId === e.id);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        hasActiveEvidence
          ? "border-[var(--glin-accent)] shadow-md"
          : open
          ? "border-[var(--glin-accent)]/40 shadow-sm"
          : "border-[var(--border)]"
      }`}
    >
      {/* Bullet header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${
          open ? "bg-[var(--glin-accent-light)]/40" : "bg-[var(--card)] hover:bg-muted/40"
        }`}
      >
        {/* Order badge */}
        <span
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white mt-0.5"
          style={{ background: "var(--glin-accent-gradient)" }}
        >
          {item.item_order}
        </span>

        {/* Text */}
        <p className="flex-1 text-sm font-medium text-foreground leading-relaxed">{item.text}</p>

        {/* Evidence count + toggle */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--glin-accent-light)] text-[var(--glin-accent)]">
            <Anchor size={9} />
            근거 {item.evidences.length}
          </span>
          {open ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Evidence list */}
      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--card)] p-3 space-y-2.5">
          {item.evidences.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              매핑된 근거가 없습니다.
            </p>
          ) : (
            <>
              <p className="text-[10px] text-muted-foreground px-1 font-medium">
                클릭하면 원문 라인이 하이라이트됩니다
              </p>
              {item.evidences.map((ev, idx) => (
                <EvidenceCard
                  key={ev.id}
                  evidence={ev}
                  index={idx}
                  isActive={activeEvidenceId === ev.id}
                  onActivate={() =>
                    onEvidenceActivate(activeEvidenceId === ev.id ? null : ev.id)
                  }
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
