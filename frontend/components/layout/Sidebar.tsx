"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Upload,
  Files,
  BarChart2,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { GlinLogo } from "../GlinLogo";
import { cn } from "../ui/utils";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const navItems: NavItemProps[] = [
  { to: "/upload", icon: <Upload size={17} />, label: "업로드" },
  { to: "/documents", icon: <Files size={17} />, label: "문서 목록" },
  { to: "/analysis", icon: <BarChart2 size={17} />, label: "요약 · 분석" },
  { to: "/settings", icon: <Settings size={17} />, label: "설정" },
];

function NavItem({ to, icon, label, badge }: NavItemProps) {
  const pathname = usePathname();
  const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <Link
      href={to}
      className={cn(
        "group flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-150 select-none min-h-[48px]",
        isActive
          ? "bg-[var(--glin-accent-light)] text-[var(--glin-accent)] font-semibold"
          : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
      )}
    >
      <span
        className={cn(
          "flex-shrink-0 transition-colors",
          isActive ? "text-[var(--glin-accent)]" : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--glin-accent)] text-white">
          {badge}
        </span>
      )}
      {isActive && (
        <ChevronRight size={13} className="text-[var(--glin-accent)] opacity-60" />
      )}
    </Link>
  );
}

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const router = useRouter();

  const userName = "사용자";
  const userEmail = "로그인 정보 없음";
  const userInitial = "사";

  const handleLogout = () => {
    router.push("/login");
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--sidebar)] overflow-hidden">
      <div
        className="flex items-center justify-between px-5 flex-shrink-0 border-b border-[var(--sidebar-border)]"
        style={{ height: 56 }}
      >
        <GlinLogo size="md" />
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="사이드바 닫기"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">
            메인 메뉴
          </p>
          {navItems.slice(0, 3).map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">
            설정
          </p>
          {navItems.slice(3).map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>
      </nav>

      <div className="flex-shrink-0 px-3 pb-4 pt-2 border-t border-[var(--sidebar-border)] space-y-3">
        <div
          className="rounded-xl px-3 py-2.5 flex items-center gap-2"
          style={{ background: "var(--glin-accent-gradient)" }}
        >
          <Sparkles size={14} className="text-white/80 flex-shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-white leading-tight">GLIN Pro</p>
            <p className="text-[10px] text-white/70 leading-tight">로컬 GPU 가속 활성화됨</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-muted cursor-pointer transition-colors group">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: "var(--glin-accent-gradient)" }}
          >
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{userName}</p>
            <p className="text-[11px] text-muted-foreground truncate leading-tight">
              {userEmail}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
            title="로그아웃"
          >
            <LogOut size={13} className="text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}