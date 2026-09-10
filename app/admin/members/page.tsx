import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { inviteMember } from "./actions";

export default async function MembersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") redirect("/");

  // 会員一覧
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("role", "member")
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: 40, maxWidth: 700, margin: "0 auto" }}>
      <h1>会員管理</h1>

      <form action={inviteMember} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginTop: 20, padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
        <label>
          氏名<br />
          <input name="full_name" required placeholder="山田 花子" style={{ padding: 6 }} />
        </label>
        <label>
          メールアドレス<br />
          <input name="email" type="email" required placeholder="member@example.com" style={{ padding: 6 }} />
        </label>
        <label>
          初期パスワード<br />
          <input name="password" required placeholder="8文字以上" style={{ padding: 6 }} />
        </label>
        <button type="submit" style={{ padding: "8px 16px", background: "#000", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
          会員を登録
        </button>
      </form>
      <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
        ※登録後、初期パスワードを会員へお伝えください。会員は初回ログイン後に変更できます（変更機能は今後実装）。
      </p>

      <h2 style={{ marginTop: 32, fontSize: 18 }}>登録済み会員（{members?.length ?? 0}名）</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #000", textAlign: "left" }}>
            <th style={{ padding: 8 }}>氏名</th>
            <th style={{ padding: 8 }}>登録日</th>
          </tr>
        </thead>
        <tbody>
          {members?.map((m) => (
            <tr key={m.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: 8 }}>{m.full_name}</td>
              <td style={{ padding: 8 }}>{new Date(m.created_at).toLocaleDateString("ja-JP")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}