import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ReservePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: trainers } = await supabase
    .from("trainers")
    .select("id, name")
    .eq("is_active", true);

  return (
    <main style={{ padding: 40, maxWidth: 600, margin: "0 auto" }}>
      <h1>トレーナーを選択</h1>
      <p>予約したいトレーナーを選んでください。</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {trainers?.map((t) => (
          <Link
            key={t.id}
            href={`/reserve/${t.id}`}
            style={{
              display: "block",
              padding: 16,
              border: "1px solid #ccc",
              borderRadius: 8,
              textDecoration: "none",
              color: "#000",
            }}
          >
            {t.name}
          </Link>
        ))}
      </div>
    </main>
  );
}