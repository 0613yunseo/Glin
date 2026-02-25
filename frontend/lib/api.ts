/**
 * Glin Backend API Client
 * - 프론트에서는 항상 상대경로(/api/...)로 호출해서 next.config.ts rewrites를 탄다.
 */

export interface DocMeta {
    id: string;
    file_name: string;
    page_count: number;
    lines: number;
    status?: "ready" | "processing" | "failed";
    ingested_at?: string;
    size?: string;
}

export interface PageMeta {
    pageNo: number;
    title?: string;
}

export interface Line {
    lineNo: number;
    text: string;
    hasAnchor?: boolean;
}

export interface Evidence {
    id: string;
    summary_item_id: string;
    document_id: string;
    page_no: number;
    line_start: number;
    line_end: number;
    quote: string;
    score: number;
    method: "embed+rerank" | "embed" | "rerank";
    supported: boolean;
    retrieval_score?: number;
    rerank_score?: number;
}

export interface SummaryItem {
    id: string;
    item_order: number;
    text: string;
    evidences: Evidence[];
}

export interface SummaryRun {
    id: string;
    run_type: "SINGLE" | "BATCH";
    document_id: string;
    document_name: string;
    style: string;
    length: string;
    summary_bullets: number;
    evidence_top_k: number;
    mode: string;
    status: "ready" | "processing" | "idle";
    created_at: string;
    latency_ms: number;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    // ✅ 상대경로로만 호출 (Next rewrites를 타게 함)
    const res = await fetch(path, {
        ...options,
        headers: {
            ...(options?.headers ?? {}),
            // FormData 업로드 대비해서 Content-Type은 강제하지 않음
            // JSON일 때만 아래에서 세팅
        },
    });

    // 에러 시 바디를 같이 보여주면 디버깅 편함
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API Error: ${res.status} ${res.statusText}${text ? ` | ${text}` : ""}`);
    }

    // 204 같은 경우 대비
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        // json 아닌 응답은 text로 반환(필요하면 T 조정)
        return (await res.text()) as unknown as T;
    }

    return (await res.json()) as T;
}

function requestJson<T>(path: string, body?: unknown, options?: RequestInit) {
    return request<T>(path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options?.headers ?? {}),
        },
        body: body !== undefined ? JSON.stringify(body) : options?.body,
    });
}

export const api = {
    // Documents
    getDocuments: () => request<DocMeta[]>("/api/documents"),
    getDocument: (id: string) => request<DocMeta>(`/api/documents/${id}`),
    getPages: (id: string) => request<PageMeta[]>(`/api/documents/${id}/pages`),
    getLines: (id: string, page: number) => request<Line[]>(`/api/documents/${id}/lines?page=${page}`),

    // Summary (백엔드에 없으면 404 날 수 있음)
    getSummary: (docId: string) =>
        request<{ summary_run: SummaryRun; items: SummaryItem[] }>(`/api/ai/summary/${docId}`),

    rerunSummary: (docId: string, options: any) =>
        requestJson<{ summary_run: SummaryRun; items: SummaryItem[] }>(`/api/ai/summary`, {
            document_id: docId,
            ...options,
        }, { method: "POST" }),

    // ✅ User (백엔드 /me에 붙이기)
    getMe: () => request<UserProfile>("/api/me"),
};