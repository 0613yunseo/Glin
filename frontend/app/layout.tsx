"use client";

import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { usePathname } from "next/navigation";
import { GoogleTagManager } from "@next/third-parties/google";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  // 로그인 화면으로 취급할 경로
  const isAuthPage =
    pathname === "/" || pathname.startsWith("/login");

  return (
    <html lang="ko" suppressHydrationWarning>
      {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}

      <body>
        <ThemeProvider>
          {isAuthPage ? (
            <>{children}</>
          ) : (
            <ClientLayout>{children}</ClientLayout>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}