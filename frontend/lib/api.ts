/**
 * Glin Backend API Client
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

// --- Types ---

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

// --- API Functions ---

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

export const api = {
    // Documents
    getDocuments: () => request<DocMeta[]>("/api/documents"),

    getDocument: (id: string) => request<DocMeta>(`/api/documents/${id}`),

    getPages: (id: string) => request<PageMeta[]>(`/api/documents/${id}/pages`),

    getLines: (id: string, page: number) =>
        request<Line[]>(`/api/documents/${id}/lines?page=${page}`),

    // Summary
    getSummary: (docId: string) =>
        request<{ summary_run: SummaryRun; items: SummaryItem[] }>(`/api/ai/summary/${docId}`),

    rerunSummary: (docId: string, options: any) =>
        request<{ summary_run: SummaryRun; items: SummaryItem[] }>(`/api/ai/summary`, {
            method: "POST",
            body: JSON.stringify({ document_id: docId, ...options }),
        }),

    // User
    getMe: () => request<UserProfile>("/api/me"),
};
