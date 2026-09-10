import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cancelBookingByOwner } from "./actions";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // ロール確認：オーナーでなければトップへ追い返す
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    redirect("/");
  }

  // 今日以降の全予約を、会員名・トレーナー名つきで取得
  const now = new Date();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, start_time, end_time, status, profiles(full_name), trainers(name)")
    .eq("status", "confirmed")
    .gte("start_time", now.toISOString())
    .order("start_time", { ascending: true });

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <main style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
      <h1>予約管理ダッシュボード</h1>
      <p style={{ color: "#555" }}>今後の予約（{bookings?.length ?? 0}件）</p>

      {!bookings || bookings.length === 0 ? (
        <p>今後の予約はありません。</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #000", textAlign: "left" }}>
              <th style={{ padding: 8 }}>日時</th>
              <th style={{ padding: 8 }}>会員</th>
              <th style={{ padding: 8 }}>担当トレーナー</th>
              <th style={{ padding: 8 }}></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const start = new Date(b.start_time);
              const end = new Date(b.end_time);
              const memberName = (b.profiles as unknown as { full_name: string })?.full_name ?? "―";
              const trainerName = (b.trainers as unknown as { name: string })?.name ?? "―";
              return (
                <tr key={b.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: 8 }}>
                    {start.getMonth() + 1}/{start.getDate()}（{weekdays[start.getDay()]}）
                    {" "}
                    {start.getHours()}:{String(start.getMinutes()).padStart(2, "0")}
                    〜
                    {end.getHours()}:{String(end.getMinutes()).padStart(2, "0")}
                  </td>
                  <td style={{ padding: 8 }}>{memberName}</td>
                  <td style={{ padding: 8 }}>{trainerName}</td>
                  <td style={{ padding: 8 }}>
                    <form action={cancelBookingByOwner.bind(null, b.id)}>
                      <button type="submit" style={{ color: "#d00", background: "none", border: "1px solid #d00", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 13 }}>
                        キャンセル
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}