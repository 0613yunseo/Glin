import { api } from "./client";

export interface DocumentItem {
  id: string;
  file_name: string;
  file_path: string;
  page_count: number;
  status: "ready" | "processing" | "failed";
  ingested_at: string;
  updated_at: string;
  lines: number;
  size: string;
  category: string;
}

/** 문서 목록 조회 */
export async function getDocuments(): Promise<DocumentItem[]> {
  return api.get<DocumentItem[]>("/documents");
}

/** 문서 상세 조회 */
export async function getDocument(docId: string): Promise<DocumentItem> {
  return api.get<DocumentItem>(`/documents/${docId}`);
}

/** 문서 업로드 (FormData 사용 시 client.request 직접 사용 또는 별도 함수) */
export async function uploadDocument(file: File): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const base = import.meta.env.VITE_API_BASE_URL ?? "";
  const res = await fetch(`${base}/documents/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}
