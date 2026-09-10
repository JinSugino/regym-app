import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateSlotsForDay } from "@/lib/slots";
import Link from "next/link";
import BookingButton from "./BookingButton";

export default async function TrainerSlotsPage({
  params,
  searchParams,
}: {
  params: Promise<{ trainerId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { trainerId } = await params;
  const { date: dateParam } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, name")
    .eq("id", trainerId)
    .single();

  const { data: schedules } = await supabase
    .from("trainer_schedules")
    .select("day_of_week, start_time, end_time")
    .eq("trainer_id", trainerId);

  // 表示対象日：URLの?date=があればその日、なければ今日
  const selectedDate = dateParam ? new Date(dateParam + "T00:00:00") : new Date();
  selectedDate.setHours(0, 0, 0, 0);

  // 今日から14日分の日付ボタン用データ
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });

  const dayOfWeek = selectedDate.getDay();
  const todaySchedule = schedules?.find((s) => s.day_of_week === dayOfWeek);

  let slots: { start: Date; end: Date }[] = [];
  if (todaySchedule) {
    const allSlots = generateSlotsForDay(
      selectedDate,
      todaySchedule.start_time,
      todaySchedule.end_time
    );

    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

    const { data: booked } = await supabase.rpc("get_booked_slots", {
      p_trainer_id: trainerId,
      p_date: dateStr,
    });

    const bookedTimes = new Set(
      (booked ?? []).map((b: { start_time: string }) =>
        new Date(b.start_time).getTime()
      )
    );

    // 過去の時刻は除外（今日の分で、もう過ぎた枠は予約できない）
    const now = new Date();
    slots = allSlots.filter(
      (slot) => !bookedTimes.has(slot.start.getTime()) && slot.start > now
    );
  }

  function toDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const selectedStr = toDateStr(selectedDate);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <main style={{ padding: 40, maxWidth: 600, margin: "0 auto" }}>
      <h1>{trainer?.name} の空き枠</h1>

      {/* 日付選択 */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 0" }}>
        {dateOptions.map((d) => {
          const ds = toDateStr(d);
          const isSelected = ds === selectedStr;
          return (
            <Link
              key={ds}
              href={`/reserve/${trainerId}?date=${ds}`}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #ccc",
                background: isSelected ? "#000" : "#fff",
                color: isSelected ? "#fff" : "#000",
                textDecoration: "none",
                whiteSpace: "nowrap",
                fontSize: 14,
              }}
            >
              {d.getMonth() + 1}/{d.getDate()}({weekdays[d.getDay()]})
            </Link>
          );
        })}
      </div>

      {/* 空き枠 */}
      {slots.length === 0 ? (
        <p>この日は予約できる枠がありません。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {slots.map((slot, i) => (
            <BookingButton
              key={i}
              trainerId={trainerId}
              trainerName={trainer?.name ?? ""}
              startISO={slot.start.toISOString()}
              endISO={slot.end.toISOString()}
              label={`${slot.start.getHours()}:${String(slot.start.getMinutes()).padStart(2, "0")} 〜 ${slot.end.getHours()}:${String(slot.end.getMinutes()).padStart(2, "0")}`}
            />
          ))}
        </div>
      )}
    </main>
  );
}