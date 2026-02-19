"use client";

import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // ✅ 로그인 화면으로 취급할 경로들
  // - 지금 너는 루트(/)에서 LoginPage를 렌더링하고 있으니 "/" 포함
  // - /login 라우트를 만들 예정이면 "/login"도 포함
  const isAuthPage =
    pathname === "/" || pathname.startsWith("/login");

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {isAuthPage ? (
            // ✅ 로그인에서는 사이드바/헤더 없는 "단독 화면"
            <>{children}</>
          ) : (
            // ✅ 나머지 페이지에서만 앱 레이아웃(사이드바) 적용
            <ClientLayout>{children}</ClientLayout>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
