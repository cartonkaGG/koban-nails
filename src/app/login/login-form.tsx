"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Mode = "login" | "register";
type Status = "idle" | "loading" | "success" | "error";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/cabinet";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const supabaseReady = isSupabaseConfigured();

  async function demoLogin() {
    const role = email.toLowerCase().includes("admin") ? "admin" : "student";
    const res = await fetch("/api/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (!res.ok) {
      throw new Error("Не вдалося увійти в демо-режим");
    }

    window.location.href = role === "admin" ? "/admin" : next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    if (!supabaseReady) {
      try {
        await demoLogin();
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Помилка входу");
      }
      return;
    }

    try {
      const supabase = createClient();

      if (mode === "register") {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split("@")[0],
            },
          },
        });

        if (authError) {
          setStatus("error");
          setError(authError.message);
          return;
        }

        setStatus("success");
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setStatus("error");
        setError("Невірний email або пароль. Якщо акаунта ще немає, створіть його нижче.");
        return;
      }

      window.location.href = next;
    } catch {
      setStatus("error");
      setError("Не вдалося увійти. Перевірте Supabase або спробуйте ще раз.");
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel/80 p-6 backdrop-blur-xl sm:p-8">
        <Link href="/" className="eyebrow">Koban nails</Link>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl">
          {mode === "login" ? "Вхід" : "Створити акаунт"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-cream-body">
          {supabaseReady
            ? "Увійдіть через email і пароль. Після авторизації відкриється ваш кабінет з курсами."
            : "Демо-режим: введіть email і будь-який пароль. Email зі словом admin відкриє адмін-панель."}
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-xl border border-line bg-black/25 p-1 text-sm">
          <button
            type="button"
            className={`rounded-lg px-3 py-2 transition ${mode === "login" ? "bg-gold text-black" : "text-cream-body hover:text-cream"}`}
            onClick={() => {
              setMode("login");
              setStatus("idle");
              setError("");
            }}
          >
            Увійти
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-2 transition ${mode === "register" ? "bg-gold text-black" : "text-cream-body hover:text-cream"}`}
            onClick={() => {
              setMode("register");
              setStatus("idle");
              setError("");
            }}
          >
            Реєстрація
          </button>
        </div>

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
          <label className="block text-sm">
            <span className="mb-2 block text-muted">Пароль</span>
            <input
              type="password"
              required
              minLength={6}
              className="field"
              placeholder="Мінімум 6 символів"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary w-full" disabled={status === "loading"}>
            {status === "loading"
              ? "Зачекайте..."
              : mode === "login"
                ? "Увійти"
                : "Створити акаунт"}
          </button>
        </form>

        {status === "success" && (
          <p className="mt-4 rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm text-cream">
            Акаунт створено. Якщо в Supabase увімкнене підтвердження email, перевірте пошту. Після підтвердження увійдіть з цим паролем.
          </p>
        )}
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      </div>
    </div>
  );
}
