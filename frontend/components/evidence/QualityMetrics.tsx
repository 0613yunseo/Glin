import React from "react";
import { TrendingUp, Shield, AlertTriangle } from "lucide-react";

interface QualityMetricsProps {
  avgScore?: number;
  evidenceCoverage?: number;
  unsupportedRate?: number;
  totalBullets?: number;
}

export function QualityMetrics({
  avgScore = 0,
  evidenceCoverage = 0,
  unsupportedRate = 0,
  totalBullets = 0,
}: QualityMetricsProps) {
  const metrics = [
    {
      label: "평균 근거 점수",
      value: avgScore,
      display: `${(avgScore * 100).toFixed(1)}%`,
      icon: <TrendingUp size={14} />,
      color: "#3b82f6",
      desc: "불릿별 최고 근거 점수의 평균",
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-200/60 dark:border-blue-800/40",
    },
    {
      label: "Evidence 커버리지",
      value: evidenceCoverage,
      display: `${(evidenceCoverage * 100).toFixed(1)}%`,
      icon: <Shield size={14} />,
      color: "#10b981",
      desc: `${totalBullets}개 불릿 중 근거가 붙은 비율`,
      bg: "bg-green-50 dark:bg-green-950/20",
      border: "border-green-200/60 dark:border-green-800/40",
    },
    {
      label: "미지지 불릿 비율",
      value: unsupportedRate,
      display: `${(unsupportedRate * 100).toFixed(1)}%`,
      icon: <AlertTriangle size={14} />,
      color: unsupportedRate > 0.2 ? "#ef4444" : "#f59e0b",
      desc: "지지되는 근거가 없는 불릿 비율",
      bg: unsupportedRate > 0.2 ? "bg-red-50 dark:bg-red-950/20" : "bg-yellow-50 dark:bg-yellow-950/20",
      border: unsupportedRate > 0.2 ? "border-red-200/60 dark:border-red-800/40" : "border-yellow-200/60 dark:border-yellow-800/40",
    },
  ];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <p className="text-xs font-bold text-foreground">품질 지표</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">이 요약 결과에서 계산한 값</p>
      </div>
      <div className="p-3 space-y-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`rounded-lg border ${m.bg} ${m.border} p-3 flex items-center gap-3`}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
              style={{ background: m.color }}
            >
              {m.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground leading-tight">{m.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{m.desc}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p
                className="text-base font-bold leading-tight"
                style={{ color: m.color }}
              >
                {m.display}
              </p>
              {/* Mini bar */}
              <div className="w-16 h-1 bg-muted rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${m.value * 100}%`,
                    background: m.color,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
