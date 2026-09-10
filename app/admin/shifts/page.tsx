import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { saveShift, deleteShift } from "./actions";

export default async function ShiftsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") redirect("/");

  const { data: trainers } = await supabase
    .from("trainers").select("id, name").eq("is_active", true);

  const { data: schedules } = await supabase
    .from("trainer_schedules")
    .select("id, trainer_id, day_of_week, start_time, end_time, trainers(name)")
    .order("day_of_week");

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <main style={{ padding: 40, maxWidth: 700, margin: "0 auto" }}>
      <h1>シフト設定</h1>

      {/* 追加フォーム */}
      <form action={saveShift} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginTop: 20, padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
        <label>
          トレーナー<br />
          <select name="trainer_id" required style={{ padding: 6 }}>
            {trainers?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
        <label>
          曜日<br />
          <select name="day_of_week" required style={{ padding: 6 }}>
            {weekdays.map((w, i) => (
              <option key={i} value={i}>{w}</option>
            ))}
          </select>
        </label>
        <label>
          開始<br />
          <input type="time" name="start_time" required defaultValue="10:00" style={{ padding: 6 }} />
        </label>
        <label>
          終了<br />
          <input type="time" name="end_time" required defaultValue="20:00" style={{ padding: 6 }} />
        </label>
        <button type="submit" style={{ padding: "8px 16px", background: "#000", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
          追加
        </button>
      </form>

      {/* 一覧 */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #000", textAlign: "left" }}>
            <th style={{ padding: 8 }}>トレーナー</th>
            <th style={{ padding: 8 }}>曜日</th>
            <th style={{ padding: 8 }}>時間</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {schedules?.map((s) => {
            const trainerName = (s.trainers as unknown as { name: string })?.name ?? "";
            return (
              <tr key={s.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: 8 }}>{trainerName}</td>
                <td style={{ padding: 8 }}>{weekdays[s.day_of_week]}</td>
                <td style={{ padding: 8 }}>{s.start_time.slice(0,5)}〜{s.end_time.slice(0,5)}</td>
                <td style={{ padding: 8 }}>
                  <form action={deleteShift.bind(null, s.id)}>
                    <button type="submit" style={{ color: "#d00", background: "none", border: "1px solid #d00", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}>
                      削除
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}