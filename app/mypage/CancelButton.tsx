"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CancelButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    if (!confirm("この予約をキャンセルしますか？")) return;
    setLoading(true);

    const supabase = createClient();
    // 予約を削除せず、statusを'cancelled'に変更（履歴を残す）
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (error) {
      alert("キャンセルに失敗しました。");
      setLoading(false);
    } else {
      alert("予約をキャンセルしました。");
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      style={{
        padding: "8px 16px",
        border: "1px solid #d00",
        color: "#d00",
        background: "#fff",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      {loading ? "処理中..." : "キャンセルする"}
    </button>
  );
}