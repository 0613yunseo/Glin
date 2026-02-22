import { api } from "./client";

/**
 * AI Agent API
 * 백엔드 엔드포인트에 맞게 path·body·응답 타입만 수정하면 됨.
 */

// 예시: 요약 실행 요청/응답 (실제 스키마에 맞게 수정)
export interface SummaryRunRequest {
  document_id: string;
  style?: string;
  length?: string;
  summary_bullets?: number;
  evidence_top_k?: number;
  mode?: string;
}

export interface SummaryRunResponse {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  created_at?: string;
}

/** 요약 실행 (AI Agent) */
export async function runSummary(
  body: SummaryRunRequest
): Promise<SummaryRunResponse> {
  return api.post<SummaryRunResponse>("/agent/summary", body);
}

/** 요약 결과 조회 */
export async function getSummaryRun(runId: string): Promise<SummaryRunResponse> {
  return api.get<SummaryRunResponse>(`/agent/summary/${runId}`);
}

// 필요하면 채팅/스트리밍 등 추가
// export async function chatWithAgent(message: string) { ... }
