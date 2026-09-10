"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BookingButton({
  trainerId,
  trainerName,
  startISO,
  endISO,
  label,
}: {
  trainerId: string;
  trainerName: string;
  startISO: string;
  endISO: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleBook() {
    if (!confirm(`${trainerName} / ${label} で予約しますか？`)) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("ログインが必要です。");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      trainer_id: trainerId,
      start_time: startISO,
      end_time: endISO,
      status: "confirmed",
    });

    if (error) {
      // 二重予約（ユニーク制約違反）を判定
      if (error.code === "23505") {
        setError("申し訳ありません。この枠は今しがた他の方に予約されました。");
      } else {
        setError("予約に失敗しました。もう一度お試しください。");
      }
      setLoading(false);
      router.refresh(); // 最新の空き枠に更新
    } else {
      alert("予約が完了しました！");
      router.push("/mypage");
      router.refresh();
    }
  }

  return (
    <div>
      <button
        onClick={handleBook}
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          border: "1px solid #000",
          borderRadius: 8,
          background: "#fff",
          cursor: "pointer",
          fontSize: 15,
        }}
      >
        {loading ? "処理中..." : label}
      </button>
      {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
    </div>
  );
}