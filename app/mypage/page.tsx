import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CancelButton from "./CancelButton";

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 自分の確定予約を、トレーナー名付きで取得（新しい順）
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, start_time, end_time, status, trainers(name)")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .order("start_time", { ascending: true });

  const now = new Date();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <main style={{ padding: 40, maxWidth: 600, margin: "0 auto" }}>
      <h1>予約一覧</h1>
      <Link href="/reserve" style={{ display: "inline-block", margin: "12px 0", color: "#0066cc" }}>
        ＋ 新しく予約する
      </Link>

      {!bookings || bookings.length === 0 ? (
        <p>現在、予約はありません。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          {bookings.map((b) => {
            const start = new Date(b.start_time);
            const end = new Date(b.end_time);
            // キャンセル可否：予約開始の24時間前までならキャンセル可
            const hoursUntil = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
            const canCancel = hoursUntil >= 24;
            const trainerName = (b.trainers as unknown as { name: string })?.name ?? "";

            return (
              <div
                key={b.id}
                style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}
              >
                <div style={{ fontWeight: "bold" }}>
                  {start.getMonth() + 1}月{start.getDate()}日（{weekdays[start.getDay()]}）
                  {" "}
                  {start.getHours()}:{String(start.getMinutes()).padStart(2, "0")}
                  {" 〜 "}
                  {end.getHours()}:{String(end.getMinutes()).padStart(2, "0")}
                </div>
                <div style={{ color: "#555", fontSize: 14, marginTop: 4 }}>
                  担当：{trainerName}
                </div>
                <div style={{ marginTop: 12 }}>
                  {canCancel ? (
                    <CancelButton bookingId={b.id} />
                  ) : (
                    <p style={{ fontSize: 13, color: "#999" }}>
                      予約24時間前を過ぎているため、キャンセルは店舗へ直接ご連絡ください。
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}