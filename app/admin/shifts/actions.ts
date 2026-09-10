"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function assertOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "owner") throw new Error("権限がありません");
  return supabase;
}

export async function saveShift(formData: FormData) {
  const supabase = await assertOwner();

  const trainerId = formData.get("trainer_id") as string;
  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;

  const { error } = await supabase.from("trainer_schedules").insert({
    trainer_id: trainerId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/shifts");
}

export async function deleteShift(id: string) {
  const supabase = await assertOwner();

  const { error } = await supabase.from("trainer_schedules").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/shifts");
}