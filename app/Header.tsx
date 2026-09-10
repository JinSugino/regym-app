import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth-actions";
import Link from "next/link";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const isOwner = profile?.role === "owner";

  return (
    <header style={{ borderBottom: "1px solid #ddd", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Link href="/" style={{ fontWeight: "bold", textDecoration: "none", color: "#000" }}>
          RE:GYM
        </Link>
        <Link href="/reserve" style={{ textDecoration: "none", color: "#333" }}>予約する</Link>
        <Link href="/mypage" style={{ textDecoration: "none", color: "#333" }}>予約一覧</Link>
        {isOwner && (
          <>
            <Link href="/admin" style={{ textDecoration: "none", color: "#333" }}>管理</Link>
            <Link href="/admin/shifts" style={{ textDecoration: "none", color: "#333" }}>シフト</Link>
            <Link href="/admin/blocks" style={{ textDecoration: "none", color: "#333" }}>ブロック</Link>
            <Link href="/admin/members" style={{ textDecoration: "none", color: "#333" }}>会員</Link>
          </>
        )}
      </nav>
      <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 14 }}>
        <span style={{ color: "#555" }}>
          {profile?.full_name}（{isOwner ? "オーナー" : "会員"}）
        </span>
        <form action={signOut}>
          <button type="submit" style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6, background: "#fff", cursor: "pointer" }}>
            ログアウト
          </button>
        </form>
      </div>
    </header>
  );
}