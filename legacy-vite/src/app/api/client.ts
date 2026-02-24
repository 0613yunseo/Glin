/// <reference types="vite/client" />
/**
 * API 베이스 URL (환경 변수)
 * .env 에서 VITE_API_BASE_URL 로 설정
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type RequestConfig = RequestInit & {
  params?: Record<string, string>;
};

async function request<T>(
  path: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, ...init } = config;
  const url = BASE_URL
    ? new URL(path, BASE_URL)
    : new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, config?: RequestConfig) =>
    request<T>(path, { ...config, method: "GET" }),
  post: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>(path, { ...config, method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>(path, { ...config, method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, config?: RequestConfig) =>
    request<T>(path, { ...config, method: "DELETE" }),
};
