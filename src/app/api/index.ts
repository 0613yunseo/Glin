export { api } from "./client";
export type { RequestConfig } from "./client";
export {
  getDocuments,
  getDocument,
  uploadDocument,
  type DocumentItem,
} from "./documents";
export {
  runSummary,
  getSummaryRun,
  type SummaryRunRequest,
  type SummaryRunResponse,
} from "./aiAgent";
export {
  generateText,
  generateTextStream,
  isGeminiAvailable,
} from "./gemini";
