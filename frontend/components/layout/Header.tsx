"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun, User, Settings, LogOut, Menu } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { GlinLogo } from "../GlinLogo";

interface HeaderProps {
  onMenuClick: () => void;
}

// ✅ TODO: Auth 연동 전 임시 사용자 타입/값
type UserProfile = { name: string; email: string } | null;

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  // ✅ 목업 제거: 하드코딩 문자열 대신 null (연동 후 setUser로 채우면 됨)
  const [user] = useState<UserProfile>(null);

  const displayName = user?.name?.trim() || "내 계정";
  const displayEmail = user?.email?.trim() || "";

  const avatarInitial = useMemo(() => {
    const first = displayName?.trim()?.[0];
    // "내 계정"이면 이니셜은 ?로
    return displayName === "내 계정" ? "?" : first ?? "?";
  }, [displayName]);

  const handleLogout = () => {
    setProfileOpen(false);
    // TODO: auth 토큰/세션 정리 로직 붙이면 여기서 처리
    router.push("/login");
  };

  return (
    <header
      className="flex items-center bg-[var(--card)] border-b border-[var(--border)] flex-shrink-0 relative z-10 w-full"
      style={{ height: 56 }}
    >
      {/* Left: hamburger + logo on mobile */}
      <div className="flex items-center flex-shrink-0">
        <button
          className="md:hidden flex items-center justify-center w-14 h-14 text-muted-foreground hover:text-foreground transition-colors"
          onClick={onMenuClick}
          aria-label="메뉴 열기"
        >
          <Menu size={20} />
        </button>
        {/* GLIN logo — mobile only */}
        <div className="md:hidden">
          <GlinLogo size="md" />
        </div>
      </div>

      {/* Spacer — pushes right actions to edge */}
      <div className="flex-1" />

      {/* Right: theme toggle + profile */}
      <div className="flex items-center gap-1 px-3">
        {/* Theme toggle — icon only on mobile, icon+text on sm+ */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center gap-2 w-11 h-11 md:w-auto md:h-auto md:px-3 md:py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          aria-label={theme === "light" ? "야간 모드" : "밝은 모드"}
        >
          {theme === "light" ? (
            <>
              <Moon size={18} className="md:hidden" />
              <Moon size={14} className="hidden md:inline" />
              <span className="hidden md:inline text-xs font-medium">
                야간 모드
              </span>
            </>
          ) : (
            <>
              <Sun size={18} className="md:hidden" />
              <Sun size={14} className="hidden md:inline" />
              <span className="hidden md:inline text-xs font-medium">
                밝은 모드
              </span>
            </>
          )}
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 pl-1.5 pr-1.5 md:pr-3 py-1.5 rounded-xl hover:bg-muted transition-all group min-h-[44px]"
            aria-label="프로필 메뉴"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: "var(--glin-accent-gradient)" }}
            >
              {avatarInitial}
            </div>

            <span className="text-sm font-medium text-foreground hidden md:inline">
              {displayName}
            </span>
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-lg z-50 overflow-hidden py-1">
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <p className="text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                  {displayEmail ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {displayEmail}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      로그인 정보 없음
                    </p>
                  )}
                </div>

                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left min-h-[44px]"
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/settings");
                  }}
                >
                  <User size={14} className="text-muted-foreground" />
                  내 계정
                </button>

                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left min-h-[44px]"
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/settings");
                  }}
                >
                  <Settings size={14} className="text-muted-foreground" />
                  설정
                </button>

                <div className="border-t border-[var(--border)] mt-1 pt-1">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left min-h-[44px]"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} />
                    로그아웃
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}