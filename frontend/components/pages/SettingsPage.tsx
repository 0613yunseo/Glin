import React, { useState } from "react";
import {
  User,
  Brain,
  Cpu,
  Shield,
  Bell,
  Check,
  HardDrive,
  Moon,
  Sun,
  Trash2,
  RefreshCw,
  FolderOpen,
  Database,
  Zap,
  Lock,
  FileText,
  Server,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

// ─── Toggle component ─────────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}
function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${checked ? "bg-[var(--glin-accent)]" : "bg-[var(--switch-background)]"
        }`}
      aria-checked={checked}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
      />
    </button>
  );
}

// ─── Section & Row wrappers ───────────────────────────────────────────────────
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  desc?: string;
  children: React.ReactNode;
}
function Section({ title, icon, desc, children }: SectionProps) {
  return (
    <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
      <div className="flex items-start gap-3 px-4 md:px-5 py-4 border-b border-[var(--border)]">
        <span className="text-[var(--glin-accent)] mt-0.5">{icon}</span>
        <div>
          <h3 className="text-foreground">{title}</h3>
          {desc && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>}
        </div>
      </div>
      <div className="divide-y divide-[var(--border)]">{children}</div>
    </div>
  );
}

interface RowProps {
  label: string;
  desc?: string;
  children: React.ReactNode;
  wrap?: boolean;
}
function Row({ label, desc, children, wrap = false }: RowProps) {
  return (
    <div
      className={`${wrap
        ? "flex flex-col gap-3 px-4 md:px-5 py-4"
        : "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 md:px-5 py-4"
        }`}
    >
      <div className="flex-shrink-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>}
      </div>
      <div className={wrap ? "" : "sm:flex-shrink-0"}>{children}</div>
    </div>
  );
}

interface BadgeProps {
  label: string;
  variant: "success" | "info" | "warning";
}
function StatusBadge({ label, variant }: BadgeProps) {
  const styles = {
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    info: "bg-[var(--glin-accent-light)] text-[var(--glin-accent)]",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };
  const icons = {
    success: <CheckCircle2 size={11} />,
    info: <Shield size={11} />,
    warning: <AlertTriangle size={11} />,
  };
  return (
    <span
      className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg w-fit ${styles[variant]}`}
    >
      {icons[variant]}
      {label}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [saved, setSaved] = useState(false);

  // Core
  const [deterministicDefault, setDeterministicDefault] = useState(true);
  const [allowlistPath, setAllowlistPath] = useState("/home/user/glin-docs");

  // ML Configuration
  const [embeddingModel, setEmbeddingModel] = useState("KR-SBERT");
  const [rerankerModel, setRerankerModel] = useState("KoELECTRA");
  const [defaultTopK, setDefaultTopK] = useState(3);
  const [supportedGate, setSupportedGate] = useState(true);

  // Performance
  const [embeddingCache, setEmbeddingCache] = useState(true);
  const [gpuAccel, setGpuAccel] = useState(true);

  // Notifications
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [notifyOnError, setNotifyOnError] = useState(true);
  const [autoDelete, setAutoDelete] = useState(false);

  // Security (read-only policy badges)
  const pathValidationEnabled = true;
  const pdfOnlyPolicy = true;

  // Account
  const [name, setName] = useState("김민준");
  const [email, setEmail] = useState("minjun@glin.ai");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-5 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground">설정</h1>
        <p className="text-muted-foreground text-sm mt-1">
          계정 · 모델 · 시스템 환경 설정
        </p>
      </div>

      {/* ── Core 설정 ── */}
      <Section
        title="코어 설정"
        icon={<Zap size={16} />}
        desc="요약 실행 기본값 및 파일 경로 정책"
      >
        <Row
          label="기본 모드"
          desc="deterministic: 재현 가능한 결과 / best_effort: 최고 품질 우선"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">best_effort</span>
            <Toggle checked={deterministicDefault} onChange={setDeterministicDefault} />
            <span
              className={`text-xs font-medium ${deterministicDefault ? "text-[var(--glin-accent)]" : "text-muted-foreground"
                }`}
            >
              deterministic
            </span>
          </div>
        </Row>
        <Row
          label="허용 디렉터리 경로"
          desc="GLIN이 접근할 수 있는 로컬 PDF 경로 (allowlist)"
          wrap
        >
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <FolderOpen
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={allowlistPath}
                onChange={(e) => setAllowlistPath(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-[var(--input-background)] border border-[var(--border)] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--glin-accent)] transition-all font-mono min-h-[48px]"
                placeholder="/path/to/pdf/directory"
              />
            </div>
            <button className="flex-shrink-0 px-3 py-3 rounded-xl text-xs font-medium border border-[var(--border)] hover:bg-muted transition-colors text-muted-foreground hover:text-foreground min-h-[48px]">
              탐색
            </button>
          </div>
        </Row>
      </Section>

      {/* ── ML 모델 설정 ── */}
      <Section
        title="ML 모델 설정"
        icon={<Brain size={16} />}
        desc="임베딩·리랭커 모델 및 근거 추출 파라미터"
      >
        {/* Embedding model */}
        <Row label="임베딩 모델" desc="문장 벡터화 모델 (KR-SBERT 권장)">
          <div className="flex flex-wrap gap-1.5">
            {["KR-SBERT", "ko-sroberta", "paraphrase-KoBERT"].map((m) => (
              <button
                key={m}
                onClick={() => setEmbeddingModel(m)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all font-mono ${embeddingModel === m
                  ? "text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                style={embeddingModel === m ? { background: "var(--glin-accent-gradient)" } : {}}
              >
                {m}
              </button>
            ))}
          </div>
        </Row>

        {/* Reranker model */}
        <Row label="리랭커 모델" desc="Cross-Encoder 재랭킹 모델 (KoELECTRA 권장)">
          <div className="flex flex-wrap gap-1.5">
            {["KoELECTRA", "KoBERT-CE", "monoBERT-ko"].map((m) => (
              <button
                key={m}
                onClick={() => setRerankerModel(m)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all font-mono ${rerankerModel === m
                  ? "text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                style={rerankerModel === m ? { background: "var(--glin-accent-gradient)" } : {}}
              >
                {m}
              </button>
            ))}
          </div>
        </Row>

        {/* Default evidence_top_k */}
        <Row label="기본 evidence_top_k" desc="요약 불릿당 추출할 근거 수 기본값">
          <div className="flex gap-1.5">
            {[1, 2, 3, 5].map((k) => (
              <button
                key={k}
                onClick={() => setDefaultTopK(k)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${defaultTopK === k
                  ? "text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                style={defaultTopK === k ? { background: "var(--glin-accent-gradient)" } : {}}
              >
                {k}
              </button>
            ))}
          </div>
        </Row>

        {/* Supported gate */}
        <Row
          label="Supported Gate"
          desc="supported=false 근거를 결과에서 필터링"
        >
          <div className="flex items-center gap-2">
            <Toggle checked={supportedGate} onChange={setSupportedGate} />
            {supportedGate && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                활성
              </span>
            )}
          </div>
        </Row>
      </Section>

      {/* ── 성능 ── */}
      <Section
        title="성능"
        icon={<Cpu size={16} />}
        desc="캐시·인덱스·GPU 가속 설정"
      >
        <Row label="임베딩 캐시" desc="이미 처리된 문서의 벡터 캐시 재사용">
          <div className="flex items-center gap-2">
            <Toggle checked={embeddingCache} onChange={setEmbeddingCache} />
            {embeddingCache && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                활성
              </span>
            )}
          </div>
        </Row>
        <Row label="GPU 가속" desc="CUDA 기반 GPU 연산 사용 (RTX 4090)">
          <div className="flex items-center gap-2">
            <Toggle checked={gpuAccel} onChange={setGpuAccel} />
            <span className="text-xs text-muted-foreground font-mono">NVIDIA RTX 4090</span>
          </div>
        </Row>
        <Row label="인덱스 재빌드" desc="FAISS 벡터 인덱스를 처음부터 재생성">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl hover:bg-muted transition-all border border-[var(--border)]">
            <Database size={12} />
            인덱스 재빌드
          </button>
        </Row>
        <Row label="임시 파일 삭제" desc="분석 중 생성된 중간 파일 정리">
          <button className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-red-200 dark:border-red-800">
            <Trash2 size={12} />
            정리하기
          </button>
        </Row>
        <Row label="모델 캐시 초기화" desc="로드된 ML 모델을 메모리에서 제거">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl hover:bg-muted transition-all border border-[var(--border)]">
            <RefreshCw size={12} />
            초기화
          </button>
        </Row>
      </Section>

      {/* ── 보안 ── */}
      <Section
        title="보안"
        icon={<Lock size={16} />}
        desc="파일 경로 검증 및 처리 정책"
      >
        <Row label="경로 검증" desc="허용된 allowlist 디렉터리 외부 접근 차단">
          <StatusBadge
            label={pathValidationEnabled ? "경로 검증 활성화됨" : "비활성화"}
            variant={pathValidationEnabled ? "success" : "warning"}
          />
        </Row>
        <Row label=".pdf 전용 정책" desc="PDF 외 파일 형식 업로드 거부">
          <StatusBadge label=".pdf only" variant="info" />
        </Row>
        <Row label="로컬 전용 처리" desc="모든 데이터를 로컬에서만 처리 (네트워크 전송 없음)">
          <StatusBadge label="로컬 처리 보장" variant="success" />
        </Row>
        <Row label="2단계 인증" desc="이메일 OTP로 추가 보안 설정">
          <Toggle checked={false} onChange={() => { }} />
        </Row>
      </Section>

      {/* ── 화면 설정 ── */}
      <Section
        title="화면 설정"
        icon={<Moon size={16} />}
        desc="테마 및 디스플레이 옵션"
      >
        <Row label="테마" desc="기본값: 밝은 모드 / 개발자 모드: 야간 모드">
          <div className="flex items-center gap-2">
            <Sun
              size={13}
              className={theme === "light" ? "text-[var(--glin-accent)]" : "text-muted-foreground"}
            />
            <Toggle checked={theme === "dark"} onChange={toggleTheme} />
            <Moon
              size={13}
              className={theme === "dark" ? "text-[var(--glin-accent)]" : "text-muted-foreground"}
            />
          </div>
        </Row>
        <Row label="현재 테마">
          <span className="text-sm font-medium text-[var(--glin-accent)]">
            {theme === "dark" ? "야간 모드 (개발자 특화)" : "밝은 모드 (기본)"}
          </span>
        </Row>
      </Section>

      {/* ── 저장소 ── */}
      <Section title="저장소" icon={<HardDrive size={16} />}>
        <div className="px-5 py-4 space-y-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>사용 중: 14.2 GB</span>
            <span>전체: 500 GB</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: "2.84%", background: "var(--glin-accent-gradient)" }}
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              문서 24개 · 분석 결과 캐시 포함
            </span>
            <button className="text-xs text-[var(--glin-accent)] hover:underline">
              상세 보기
            </button>
          </div>
        </div>
      </Section>

      {/* ── 알림 ── */}
      <Section title="알림" icon={<Bell size={16} />}>
        <Row label="분석 완료 알림" desc="처리 완료 시 데스크탑 알림">
          <Toggle checked={notifyOnComplete} onChange={setNotifyOnComplete} />
        </Row>
        <Row label="오류 알림" desc="처리 실패 시 알림 수신">
          <Toggle checked={notifyOnError} onChange={setNotifyOnError} />
        </Row>
        <Row label="자동 삭제" desc="30일 이후 분석 결과 자동 삭제">
          <Toggle checked={autoDelete} onChange={setAutoDelete} />
        </Row>
      </Section>

      {/* ── 내 계정 ── */}
      <Section title="내 계정" icon={<User size={16} />}>
        <Row label="이름" desc="프로필에 표시됩니다">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full sm:w-auto text-sm bg-[var(--input-background)] border border-[var(--border)] rounded-xl px-3 py-2.5 focus:border-[var(--glin-accent)] outline-none text-foreground transition-colors focus:ring-2 focus:ring-[var(--glin-accent)] min-h-[44px]"
          />
        </Row>
        <Row label="이메일" desc="알림 수신 이메일">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full sm:w-auto text-sm bg-[var(--input-background)] border border-[var(--border)] rounded-xl px-3 py-2.5 focus:border-[var(--glin-accent)] outline-none text-foreground transition-colors focus:ring-2 focus:ring-[var(--glin-accent)] min-h-[44px]"
          />
        </Row>
        <div className="px-4 md:px-5 py-4 flex items-center gap-3">
          <button className="text-sm text-[var(--glin-accent)] hover:underline font-medium min-h-[44px]">
            비밀번호 변경
          </button>
          <span className="text-muted-foreground/40">·</span>
          <button className="text-sm text-red-500 hover:underline min-h-[44px]">계정 삭제</button>
        </div>
      </Section>

      {/* Save button — full width on mobile */}
      <div className="flex justify-stretch sm:justify-end pb-6">
        <button
          onClick={handleSave}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all min-h-[52px]"
          style={{ background: "var(--glin-accent-gradient)" }}
        >
          {saved ? (
            <>
              <Check size={15} /> 저장됨
            </>
          ) : (
            "변경사항 저장"
          )}
        </button>
      </div>
    </div>
  );
}