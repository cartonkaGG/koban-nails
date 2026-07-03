"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function isSupabaseReady() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function demoLogin() {
    const role = email.toLowerCase().includes("admin") ? "admin" : "student";
    await fetch("/api/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    window.location.href = role === "admin" ? "/admin" : "/cabinet";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    if (!isSupabaseReady()) {
      await demoLogin();
      return;
    }

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setStatus("error");
        setError(authError.message);
        return;
      }

      setStatus("sent");
    } catch {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        await demoLogin();
        return;
      }

      setStatus("error");
      setError("Не вдалося підключитися до сервісу входу. Перевірте Supabase URL та anon key.");
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel/80 p-6 backdrop-blur-xl sm:p-8">
        <Link href="/" className="eyebrow">Koban nails</Link>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl">Вхід по email</h1>
        <p className="mt-3 text-sm leading-relaxed text-cream-body">
          Надішлемо безпечне посилання для входу. Якщо сайт запущений локально без Supabase,
          відкриється демо-кабінет з курсами.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="mb-2 block text-muted">Email</span>
            <input
              type="email"
              required
              className="field"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary w-full" disabled={status === "loading" || status === "sent"}>
            {status === "loading" ? "Входимо..." : status === "sent" ? "Посилання надіслано" : "Отримати посилання"}
          </button>
        </form>

        {status === "sent" && (
          <p className="mt-4 rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm text-cream">
            Перевірте пошту та перейдіть за посиланням.
          </p>
        )}
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        <p className="mt-6 rounded-lg border border-line bg-black/30 p-3 text-xs leading-relaxed text-muted">
          Для справжніх magic link листів потрібно заповнити <strong>NEXT_PUBLIC_SUPABASE_URL</strong> і{" "}
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong>. Без них локально працює демо-вхід.
        </p>
      </div>
    </div>
  );
}
