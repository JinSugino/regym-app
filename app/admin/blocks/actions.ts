"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") throw new Error("権限がありません");
  return supabase;
}

// 指定トレーナー・指定枠（開始ISO）をブロックする
export async function blockSlot(trainerId: string, startISO: string, dateParam: string) {
  const supabase = await assertOwner();

  const start = new Date(startISO);
  const end = new Date(start);
  end.setMinutes(start.getMinutes() + 60);

  const { error } = await supabase.from("bookings").insert({
    user_id: null,
    trainer_id: trainerId,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    status: "blocked",
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/blocks`);
}

// ブロックを解除する
export async function unblockSlot(bookingId: string) {
  const supabase = await assertOwner();
  const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/blocks`);
}

// オーナーが会員の代理で予約を入れる
export async function bookForMember(
  trainerId: string,
  startISO: string,
  formData: FormData
) {
  await assertOwner();

  const memberId = formData.get("__memberId") as string;
  if (!memberId) throw new Error("会員を選択してください");

  const admin = createAdminClient();
  const start = new Date(startISO);
  const end = new Date(start);
  end.setMinutes(start.getMinutes() + 60);

  const { error } = await admin.from("bookings").insert({
    user_id: memberId,
    trainer_id: trainerId,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    status: "confirmed",
  });
  if (error) {
    if (error.code === "23505") throw new Error("この枠は既に埋まっています");
    throw new Error(error.message);
  }

  revalidatePath("/admin/blocks");
}