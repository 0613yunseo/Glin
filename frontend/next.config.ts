import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/documents",
        destination: "http://127.0.0.1:8000/documents/",
      },
      {
        source: "/api/documents/:path*",
        destination: "http://127.0.0.1:8000/documents/:path*",
      },
      {
        source: "/api/me",
        destination: "http://127.0.0.1:8000/me",
      },
      {
        source: "/api/me/:path*",
        destination: "http://127.0.0.1:8000/me/:path*",
      },
    ];
  },
};

export default nextConfig;