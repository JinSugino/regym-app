import "server-only";
import { createClient } from "@supabase/supabase-js";

// service_role キーで動く管理者用クライアント（サーバー専用・RLSを迂回）
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}