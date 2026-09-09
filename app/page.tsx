import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();

  // 現在ログインしているユーザーを取得
  const { data: { user } } = await supabase.auth.getUser();

  // 未ログインならログイン画面へ飛ばす
  if (!user) {
    redirect("/login");
  }

  // ログインユーザーのprofile（名前・ロール）を取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // トレーナー一覧も取得（接続確認を兼ねる）
  const { data: trainers } = await supabase
    .from("trainers")
    .select("id, name");

  return (
    <main style={{ padding: 40, maxWidth: 600, margin: "0 auto" }}>
      <h1>ようこそ、{profile?.full_name ?? "ゲスト"}さん</h1>
      <p>
        ロール:{" "}
        {profile?.role === "owner"
          ? "オーナー（管理者）"
          : profile?.role === "member"
          ? "会員"
          : "未設定"}
      </p>
      <hr style={{ margin: "20px 0" }} />
      <h2>トレーナー一覧</h2>
      <ul>
        {trainers?.map((t) => (
          <li key={t.id}>{t.name}</li>
        ))}
      </ul>
    </main>
  );
}