"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function assertOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") throw new Error("権限がありません");
}

export async function inviteMember(formData: FormData) {
  await assertOwner(); // オーナーだけが実行できることを確認

  const email = (formData.get("email") as string)?.trim();
  const fullName = (formData.get("full_name") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();

  if (!email || !fullName || !password) {
    throw new Error("すべての項目を入力してください");
  }

  const admin = createAdminClient();

  // 1. 認証ユーザーを作成（メール確認済み扱いで即ログイン可能に）
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) throw new Error("ユーザー作成に失敗: " + createError.message);

  const newUserId = created.user?.id;
  if (!newUserId) throw new Error("ユーザーIDの取得に失敗しました");

  // 2. profiles に会員として登録
  const { error: profileError } = await admin.from("profiles").insert({
    id: newUserId,
    full_name: fullName,
    role: "member",
  });
  if (profileError) throw new Error("プロフィール登録に失敗: " + profileError.message);

  revalidatePath("/admin/members");
}