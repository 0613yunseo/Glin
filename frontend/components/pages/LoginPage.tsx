"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { GlinLogo } from "../GlinLogo";
import { useTheme } from "../../context/ThemeContext";

// Google icon
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// Notion icon
function NotionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError("");
    // Simulate auth
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    router.push("/upload");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          theme === "dark"
            ? "linear-gradient(135deg, #0d1117 0%, #111827 50%, #0d1a2e 100%)"
            : "linear-gradient(135deg, #f0f4ff 0%, #f8faff 50%, #eef4ff 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-[-120px] right-[-80px] w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "var(--glin-accent-gradient)" }}
      />
      <div
        className="absolute bottom-[-80px] left-[-60px] w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "var(--glin-accent-gradient)" }}
      />

      {/* Theme toggle — top right */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl hover:bg-[var(--card)] transition-all border border-[var(--border)]"
      >
        {theme === "light" ? "야간 모드" : "밝은 모드"}
      </button>

      {/* Glass card */}
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] shadow-2xl p-8 relative"
        style={{
          background:
            theme === "dark"
              ? "rgba(22, 29, 46, 0.85)"
              : "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <GlinLogo size="lg" asLink={false} />
        </div>
        <p className="text-center text-xs text-muted-foreground mb-8">
          로컬 PDF 요약 · 라인 근거 분석 시스템
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3.5 rounded-xl bg-[var(--input-background)] border border-[var(--border)] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[var(--glin-accent)] focus:border-transparent transition-all text-sm min-h-[52px]"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">비밀번호</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 pr-12 rounded-xl bg-[var(--input-background)] border border-[var(--border)] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[var(--glin-accent)] focus:border-transparent transition-all text-sm min-h-[52px]"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}

                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs text-[var(--glin-accent)] hover:underline min-h-[44px] px-1"
            >
              비밀번호를 잊으셨나요?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed min-h-[52px]"
            style={{ background: "var(--glin-accent-gradient)" }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                로그인
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 text-xs text-muted-foreground bg-[var(--card)]"
              style={{ background: theme === "dark" ? "transparent" : undefined }}>
              또는 소셜 계정으로
            </span>
          </div>
        </div>

        {/* Social buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => router.push("/upload")}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--input-background)] hover:bg-muted text-foreground text-sm font-medium transition-all min-h-[52px]"
          >
            <GoogleIcon />
            Google로 계속
          </button>
          <button
            type="button"
            onClick={() => router.push("/upload")}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--input-background)] hover:bg-muted text-foreground text-sm font-medium transition-all min-h-[52px]"
          >
            <NotionIcon />
            Notion으로 계속
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        계정이 없으신가요?{" "}
        <button className="text-[var(--glin-accent)] hover:underline font-medium">
          팀에 문의하기
        </button>
      </p>
    </div>
  );
}