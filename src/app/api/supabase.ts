/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

if (!url || !anonKey) {
  console.warn(
    "Supabase 연결 안 됨: .env에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 넣고 dev 서버를 재시작하세요."
  );
}

export const supabase = createClient(url, anonKey);

/** Supabase 사용 가능 여부 */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}
