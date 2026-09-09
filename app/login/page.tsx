"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("ログインに失敗しました。メールアドレスとパスワードを確認してください。");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 400, margin: "0 auto" }}>
      <h1>ログイン</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ padding: 10, background: "#000", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </div>
    </main>
  );
}