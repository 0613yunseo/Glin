import type { NextConfig } from "next";

// 백엔드 주소. 배포 환경(Vercel)에서는 NEXT_PUBLIC_API_BASE_URL에 Render 주소를 넣는다.
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/documents", destination: `${API_BASE}/documents/` },
      { source: "/api/documents/:path*", destination: `${API_BASE}/documents/:path*` },
      { source: "/api/me", destination: `${API_BASE}/me` },
      { source: "/api/me/:path*", destination: `${API_BASE}/me/:path*` },
    ];
  },
};

export default nextConfig;
