import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateSlotsForDay } from "@/lib/slots";

export default async function TrainerSlotsPage({
  params,
}: {
  params: Promise<{ trainerId: string }>;
}) {
  const { trainerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // トレーナー情報を取得
  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, name")
    .eq("id", trainerId)
    .single();

  // このトレーナーのシフトを取得
  const { data: schedules } = await supabase
    .from("trainer_schedules")
    .select("day_of_week, start_time, end_time")
    .eq("trainer_id", trainerId);

  // 「明日」の枠を試しに算出してみる（動作確認用）
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayOfWeek = tomorrow.getDay(); // 0=日 ... 6=土

  const todaySchedule = schedules?.find((s) => s.day_of_week === dayOfWeek);

  let slots: { start: Date; end: Date }[] = [];
  if (todaySchedule) {
    const allSlots = generateSlotsForDay(
      tomorrow,
      todaySchedule.start_time,
      todaySchedule.end_time
    );

    // 明日の日付を YYYY-MM-DD 形式に
    const dateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    // DB関数で「埋まっている開始時刻」を取得
    const { data: booked } = await supabase.rpc("get_booked_slots", {
      p_trainer_id: trainerId,
      p_date: dateStr,
    });

    // 埋まっている時刻を、比較しやすい形（ミリ秒）の集合にする
    const bookedTimes = new Set(
      (booked ?? []).map((b: { start_time: string }) =>
        new Date(b.start_time).getTime()
      )
    );

    // 候補枠から、埋まっている枠を除外 = 空き枠
    slots = allSlots.filter((slot) => !bookedTimes.has(slot.start.getTime()));
  }

  return (
    <main style={{ padding: 40, maxWidth: 600, margin: "0 auto" }}>
      <h1>{trainer?.name} の空き枠</h1>
      <p>
        {tomorrow.getMonth() + 1}月{tomorrow.getDate()}日（明日）の枠
      </p>
      {slots.length === 0 ? (
        <p>この日は予約枠がありません（定休日など）。</p>
      ) : (
        <ul>
          {slots.map((slot, i) => (
            <li key={i}>
              {slot.start.getHours()}:
              {String(slot.start.getMinutes()).padStart(2, "0")}
              〜
              {slot.end.getHours()}:
              {String(slot.end.getMinutes()).padStart(2, "0")}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}