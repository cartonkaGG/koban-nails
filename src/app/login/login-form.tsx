"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Mode = "login" | "register";
type Status = "idle" | "loading" | "success" | "error";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/cabinet";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const supabaseReady = isSupabaseConfigured();

  async function authRequest(path: "/api/auth/login" | "/api/auth/register", repairUnconfirmedOnly = false) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, redirectTo: next, repairUnconfirmedOnly }),
        signal: controller.signal,
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; redirectTo?: string }
        | null;

      return {
        ok: response.ok,
        error: result?.error,
        redirectTo: result?.redirectTo ?? next,
        status: response.status,
      };
    } finally {
      window.clearTimeout(timeout);
    }
  }

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

    window.location.assign(role === "admin" ? "/admin" : next);
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
      if (mode === "register") {
        const registerResult = await authRequest("/api/auth/register");

        if (!registerResult.ok) {
          if (registerResult.status === 409) {
            const loginResult = await authRequest("/api/auth/login");

            if (loginResult.ok) {
              window.location.assign(loginResult.redirectTo);
              return;
            }

            setStatus("error");
            setError(loginResult.error ?? "Акаунт уже існує, але пароль не підходить.");
            return;
          }

          setStatus("error");
          setError(registerResult.error ?? "Не вдалося створити акаунт.");
          return;
        }

        window.location.assign(registerResult.redirectTo);
        return;
      }

      const loginResult = await authRequest("/api/auth/login");

      if (!loginResult.ok) {
        const repairResult = await authRequest("/api/auth/register", true);

        if (repairResult.ok) {
          window.location.assign(repairResult.redirectTo);
          return;
        }

        setStatus("error");
        setError(loginResult.error ?? "Невірний email або пароль.");
        return;
      }

      window.location.assign(loginResult.redirectTo);
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof DOMException && err.name === "AbortError"
          ? "Supabase довго не відповідає. Спробуйте ще раз."
          : "Не вдалося увійти. Перевірте Supabase або спробуйте ще раз.",
      );
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
            <span className="relative block">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                className="field pr-12"
                placeholder="Мінімум 6 символів"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:bg-white/5 hover:text-gold"
                aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <svg
                    aria-hidden="true"
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.3A8.8 8.8 0 0112 5c5 0 8 4.5 9 7a12.8 12.8 0 01-2.2 3.3M6.5 6.5A13.5 13.5 0 003 12c1 2.5 4 7 9 7 1.6 0 3-.5 4.2-1.2"
                    />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.8 12S6 5 12 5s9.2 7 9.2 7S18 19 12 19s-9.2-7-9.2-7z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                    />
                  </svg>
                )}
              </button>
            </span>
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
            Акаунт створено. Зараз відкриваємо кабінет.
          </p>
        )}
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      </div>
    </div>
  );
}
