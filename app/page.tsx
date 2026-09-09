import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: trainers, error } = await supabase
    .from("trainers")
    .select("id, name");

  return (
    <main style={{ padding: 40 }}>
      <h1>接続テスト：トレーナー一覧</h1>
      {error && <p style={{ color: "red" }}>エラー: {error.message}</p>}
      <ul>
        {trainers?.map((t) => (
          <li key={t.id}>{t.name}</li>
        ))}
      </ul>
    </main>
  );
}