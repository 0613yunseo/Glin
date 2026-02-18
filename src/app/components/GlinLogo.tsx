import React from "react";
import { Link } from "react-router";
import { cn } from "./ui/utils";

interface GlinLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  asLink?: boolean;
}

const SIZES = {
  sm: { text: 18, iWidth: 8, iHeight: 22, dotR: 1.8, barW: 2.5 },
  md: { text: 22, iWidth: 10, iHeight: 26, dotR: 2.2, barW: 3 },
  lg: { text: 28, iWidth: 13, iHeight: 34, dotR: 2.8, barW: 3.8 },
};

function AnchorI({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = SIZES[size];
  const cx = s.iWidth / 2;
  const dotY = s.dotR + 0.5;
  const barTop = dotY + s.dotR + 3;
  const barHeight = s.iHeight - barTop - 1;

  return (
    <svg
      width={s.iWidth}
      height={s.iHeight}
      viewBox={`0 0 ${s.iWidth} ${s.iHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "bottom", marginBottom: 1 }}
    >
      {/* Anchor dot — the line anchor point */}
      <circle cx={cx} cy={dotY} r={s.dotR} fill="currentColor" />
      {/* Vertical I bar */}
      <rect
        x={cx - s.barW / 2}
        y={barTop}
        width={s.barW}
        height={barHeight}
        rx={s.barW / 2}
        fill="currentColor"
      />
    </svg>
  );
}

export function GlinLogo({ className, size = "md", asLink = true }: GlinLogoProps) {
  const s = SIZES[size];

  const inner = (
    <span
      className={cn("inline-flex items-end select-none cursor-pointer", className)}
      style={{
        fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
        fontWeight: 800,
        fontSize: s.text,
        lineHeight: 1,
        letterSpacing: "-0.04em",
        color: "inherit",
      }}
    >
      <span style={{ lineHeight: 1 }}>GL</span>
      <AnchorI size={size} />
      <span style={{ lineHeight: 1 }}>N</span>
    </span>
  );

  if (!asLink) return inner;

  return (
    <Link to="/upload" className="no-underline text-inherit">
      {inner}
    </Link>
  );
}
