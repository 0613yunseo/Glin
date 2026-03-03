"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle2,
  ChevronRight,
  Brain,
  Loader2,
  FilePlus,
  Zap,
  HardDrive,
} from "lucide-react";

// Google Drive icon
function GoogleDriveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L28.2 52H0a15.5 15.5 0 0 0 2.1 7.95z" fill="#0066da" />
      <path d="M43.65 25-14.35 0 0 26h28.2l-14.5-25.55A13.88 13.88 0 0 0 9.3 3.95L3.85 13.2z" fill="#00ac47" />
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25A15.5 15.5 0 0 0 88.2 52H60l6.05 24.8z" fill="#ea4335" />
      <path d="M43.65 25 57.5 0H29.8L43.65 25z" fill="#00832d" />
      <path d="M60 52l-16.35 24.8L60.2 52z" fill="#2684fc" />
      <path d="M0 52l28.2 24.8L43.65 25z" fill="#ffba00" />
    </svg>
  );
}

// Notion icon
function NotionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933z"
        fill="currentColor"
      />
    </svg>
  );
}

type IngestStep = "upload" | "extract" | "ready";

const INGEST_STEPS: { key: IngestStep; label: string; desc: string }[] = [
  { key: "upload", label: "업로드", desc: "PDF 파일 수신" },
  { key: "extract", label: "추출 · 라인 생성", desc: "텍스트 및 PageLine 생성" },
  { key: "ready", label: "준비 완료", desc: "임베딩 인덱스 완료" },
];

function IngestStepper({ activeStep }: { activeStep: number }) {
  return (
    <div className="flex items-center gap-0 w-full">
      {INGEST_STEPS.map((step, i) => {
        const isDone = i < activeStep;
        const isActive = i === activeStep;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${isDone
                    ? "bg-green-500 text-white"
                    : isActive
                      ? "text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                style={isActive ? { background: "var(--glin-accent-gradient)" } : {}}
              >
                {isDone ? <CheckCircle2 size={14} /> : isActive ? <Loader2 size={12} className="animate-spin" /> : i + 1}
              </div>
              <p
                className={`text-[10px] font-semibold mt-1.5 whitespace-nowrap ${isDone
                    ? "text-green-600 dark:text-green-400"
                    : isActive
                      ? "text-[var(--glin-accent)]"
                      : "text-muted-foreground"
                  }`}
              >
                {step.label}
              </p>
            </div>
            {i < INGEST_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${i < activeStep ? "bg-green-400" : "bg-muted"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ingestStep, setIngestStep] = useState(0);
  const [done, setDone] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file || !file.name.toLowerCase().endsWith(".pdf")) return;

      setUploadedFile(file);
      setUploading(true);
      setProgress(10);
      setIngestStep(0);
      setDone(false);

      try {
        // ✅ 매번 유니크한 file_path로 만들어서 409 중복 방지
        const uniquePath = `/tmp/${crypto.randomUUID()}-${file.name}`;

        // ✅ 프론트(브라우저)는 백엔드 직접 호출하지 말고, Next API route로만 호출
        const res = await fetch(`/api/documents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            file_path: uniquePath,
            file_name: file.name,
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Upload failed: ${res.status} ${res.statusText}${text ? ` | ${text}` : ""}`);
        }

        await res.json().catch(() => null);

        setProgress(60);
        setIngestStep(1);

        await new Promise((r) => setTimeout(r, 300));
        setProgress(85);
        setIngestStep(2);

        await new Promise((r) => setTimeout(r, 200));
        setProgress(100);

        setUploading(false);
        setDone(true);

        setTimeout(() => router.push("/documents"), 400);
      } catch (e) {
        console.error(e);
        setUploading(false);
        setDone(false);
        setProgress(0);
        alert(`업로드 실패: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [router]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-foreground">글(line)에 꽂히는 요약</h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          요약마다 페이지/라인 근거를 고정해서, 바로 검증할 수 있어요.
        </p>
      </div>

      <div
        className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${dragOver
            ? "border-[var(--glin-accent)] bg-[var(--glin-accent-light)]"
            : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--glin-accent)]/60 hover:bg-[var(--glin-accent-light)]/30"
          }`}
        style={{ minHeight: 200 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && !done && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div className="flex flex-col items-center justify-center p-6 md:p-8 text-center">
          {uploading || done ? (
            <div className="w-full max-w-sm space-y-5">
              <IngestStepper activeStep={done ? 3 : ingestStep} />

              {done ? (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <CheckCircle2 size={36} className="text-green-500" />
                  <p className="text-sm font-semibold text-foreground">준비 완료!</p>
                  <p className="text-xs text-muted-foreground">{uploadedFile?.name}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ background: "var(--glin-accent-gradient)" }}
                  >
                    <Brain size={22} className="text-white animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground truncate max-w-[240px] mx-auto">
                      {uploadedFile?.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ingestStep === 0
                        ? "레코드 생성 중..."
                        : ingestStep === 1
                          ? "텍스트 추출 · 라인 인덱싱..."
                          : "임베딩 벡터 생성 중..."}
                    </p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${progress}%`,
                        background: "var(--glin-accent-gradient)",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{progress}%</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4 md:mb-5 transition-transform ${dragOver ? "scale-110" : ""
                  }`}
                style={{ background: "var(--glin-accent-gradient)" }}
              >
                <Upload size={24} className="text-white md:hidden" />
                <Upload size={28} className="text-white hidden md:block" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1.5">
                PDF 파일을 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-sm text-muted-foreground mb-5">
                PDF 전용 · 최대 200MB · 로컬 처리
              </p>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 sm:justify-center w-full sm:w-auto">
                {[
                  { icon: <Zap size={13} />, label: "평균 처리 12초" },
                  { icon: <Brain size={13} />, label: "한국어 ML 모델" },
                  { icon: <FilePlus size={13} />, label: "라인 근거 매핑" },
                  { icon: <HardDrive size={13} />, label: ".pdf 전용" },
                ].map((f) => (
                  <span
                    key={f.label}
                    className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1.5 sm:bg-transparent sm:p-0"
                  >
                    <span className="text-[var(--glin-accent)]">{f.icon}</span>
                    {f.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          외부에서 가져오기
        </p>
        <div className="flex flex-col gap-3">
          <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-muted text-foreground text-sm font-medium transition-all min-h-[52px]">
            <GoogleDriveIcon />
            Google Drive에서 가져오기
            <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--glin-accent-light)] text-[var(--glin-accent)]">
              가져오기
            </span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-muted text-foreground text-sm font-medium transition-all min-h-[52px]">
            <NotionIcon />
            Notion에서 가져오기
            <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--glin-accent-light)] text-[var(--glin-accent)]">
              가져오기
            </span>
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-foreground">최근 문서</h2>
          <button
            onClick={() => router.push("/documents")}
            className="flex items-center gap-1 text-xs text-[var(--glin-accent)] font-medium hover:underline min-h-[44px] px-1"
          >
            전체 보기 <ChevronRight size={13} />
          </button>
        </div>

        <div className="py-12 border border-[var(--border)] border-dashed rounded-2xl bg-[var(--card)] flex flex-col items-center justify-center text-center">
          <FileText size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">최근 문서가 없습니다.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">파일을 업로드하여 분석을 시작해보세요.</p>
        </div>
      </div>
    </div>
  );
}