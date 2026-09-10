import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateSlotsForDay } from "@/lib/slots";
import { blockSlot, unblockSlot, bookForMember } from "./actions";
import Link from "next/link";

export default async function BlocksPage({
  searchParams,
}: {
  searchParams: Promise<{ trainer?: string; date?: string }>;
}) {
  const { trainer: trainerParam, date: dateParam } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") redirect("/");

  const { data: trainers } = await supabase
    .from("trainers").select("id, name").eq("is_active", true);

  const { data: membersList } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "member")
    .order("full_name");

  // 選択中トレーナー（未指定なら先頭）
  const trainerId = trainerParam ?? trainers?.[0]?.id ?? "";

  // 選択中の日付（未指定なら今日）
  const selectedDate = dateParam ? new Date(dateParam + "T00:00:00") : new Date();
  selectedDate.setHours(0, 0, 0, 0);

  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });

  function toDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const selectedStr = toDateStr(selectedDate);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  // 選択トレーナーのシフトから候補枠を生成
  const { data: schedules } = await supabase
    .from("trainer_schedules")
    .select("day_of_week, start_time, end_time")
    .eq("trainer_id", trainerId);

  const dayOfWeek = selectedDate.getDay();
  const todaySchedule = schedules?.find((s) => s.day_of_week === dayOfWeek);

  let allSlots: { start: Date; end: Date }[] = [];
  if (todaySchedule) {
    allSlots = generateSlotsForDay(selectedDate, todaySchedule.start_time, todaySchedule.end_time);
  }

  // その日の予約・ブロックを取得（オーナー権限で直接読む）
  const dayStart = new Date(selectedDate);
  const dayEnd = new Date(selectedDate);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const { data: existing } = await supabase
    .from("bookings")
    .select("id, start_time, status")
    .eq("trainer_id", trainerId)
    .in("status", ["confirmed", "blocked"])
    .gte("start_time", dayStart.toISOString())
    .lt("start_time", dayEnd.toISOString());

  // 開始時刻(ミリ秒) → {id, status} の対応表
  const byTime = new Map<number, { id: string; status: string }>();
  (existing ?? []).forEach((e) => {
    byTime.set(new Date(e.start_time).getTime(), { id: e.id, status: e.status });
  });

  return (
    <main style={{ padding: 40, maxWidth: 700, margin: "0 auto" }}>
      <h1>予約不可枠（ブロック）設定</h1>
      <p style={{ color: "#555", fontSize: 14 }}>
        枠を選んでブロック／解除します。予約済みの枠はブロックできません。
      </p>

      {/* トレーナー選択 */}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        {trainers?.map((t) => (
          <Link
            key={t.id}
            href={`/admin/blocks?trainer=${t.id}&date=${selectedStr}`}
            style={{
              padding: "6px 12px", borderRadius: 8, border: "1px solid #ccc",
              background: t.id === trainerId ? "#000" : "#fff",
              color: t.id === trainerId ? "#fff" : "#000",
              textDecoration: "none", fontSize: 14,
            }}
          >
            {t.name}
          </Link>
        ))}
      </div>

      {/* 日付選択 */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 0" }}>
        {dateOptions.map((d) => {
          const ds = toDateStr(d);
          const isSel = ds === selectedStr;
          return (
            <Link
              key={ds}
              href={`/admin/blocks?trainer=${trainerId}&date=${ds}`}
              style={{
                padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc",
                background: isSel ? "#000" : "#fff", color: isSel ? "#fff" : "#000",
                textDecoration: "none", whiteSpace: "nowrap", fontSize: 14,
              }}
            >
              {d.getMonth() + 1}/{d.getDate()}({weekdays[d.getDay()]})
            </Link>
          );
        })}
      </div>

      {/* 枠一覧 */}
      {allSlots.length === 0 ? (
        <p>この日はシフトがありません（定休など）。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {allSlots.map((slot, i) => {
            const info = byTime.get(slot.start.getTime());
            const label = `${slot.start.getHours()}:${String(slot.start.getMinutes()).padStart(2, "0")} 〜 ${slot.end.getHours()}:${String(slot.end.getMinutes()).padStart(2, "0")}`;

            let right;
            if (!info) {
              // 空き → ブロック or 代理予約
              right = (
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <form action={bookForMember.bind(null, trainerId, slot.start.toISOString())} style={{ display: "flex", gap: 4 }}>
                    <select name="__memberId" required style={{ padding: 4, fontSize: 13 }} onChange={undefined}>
                      <option value="">会員を選択</option>
                      {membersList?.map((m) => (
                        <option key={m.id} value={m.id}>{m.full_name}</option>
                      ))}
                    </select>
                    <button type="submit" style={{ padding: "6px 10px", border: "1px solid #0066cc", color: "#0066cc", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 }}>
                      代理予約
                    </button>
                  </form>
                  <form action={blockSlot.bind(null, trainerId, slot.start.toISOString(), selectedStr)}>
                    <button type="submit" style={{ padding: "6px 10px", border: "1px solid #000", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 }}>
                      ブロック
                    </button>
                  </form>
                </div>
              );
            } else if (info.status === "blocked") {
              right = (
                <form action={unblockSlot.bind(null, info.id)}>
                  <button type="submit" style={{ padding: "6px 12px", border: "1px solid #d00", color: "#d00", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 }}>
                    解除
                  </button>
                </form>
              );
            } else {
              // confirmed → 予約済み表示（操作不可）
              right = <span style={{ color: "#0066cc", fontSize: 13 }}>予約あり</span>;
            }

            return (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", border: "1px solid #ddd", borderRadius: 8,
                background: info?.status === "blocked" ? "#fbeaea" : info?.status === "confirmed" ? "#eef4fb" : "#fff",
              }}>
                <span>{label}</span>
                {right}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}