"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setStatus("error");
      setError("Пароль має містити щонайменше 6 символів.");
      return;
    }

    if (password !== confirm) {
      setStatus("error");
      setError("Паролі не збігаються.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string; redirectTo?: string }
        | null;

      if (!res.ok) {
        setStatus("error");
        setError(data?.error ?? "Не вдалося змінити пароль.");
        return;
      }

      setStatus("success");
      window.location.assign(data?.redirectTo ?? "/cabinet");
    } catch {
      setStatus("error");
      setError("Помилка мережі. Спробуйте ще раз.");
    }
  }

  return (
    <main className="v2-landing min-h-screen px-4 py-16">
      <div className="mx-auto w-full max-w-md rounded-[1.75rem] bg-white p-8 shadow-[var(--shadow-v2-card)] ring-1 ring-v2-ink/5">
        <p className="text-sm font-medium text-v2-clay">Безпека акаунту</p>
        <h1 className="mt-2 font-v2-display text-3xl font-semibold text-v2-ink">
          Новий пароль
        </h1>
        <p className="mt-2 text-sm text-v2-mute">
          Придумайте новий пароль для входу в кабінет Koban nails.
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-v2-ink">Новий пароль</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-v2-ink/10 bg-v2-cream/40 px-4 py-3 text-v2-ink outline-none ring-v2-clay/30 focus:ring-2"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-v2-ink">Повторіть пароль</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-v2-ink/10 bg-v2-cream/40 px-4 py-3 text-v2-ink outline-none ring-v2-clay/30 focus:ring-2"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="inline-flex w-full items-center justify-center rounded-full bg-v2-clay px-5 py-3 text-sm font-semibold text-v2-cream transition-colors hover:bg-v2-clay-dark disabled:opacity-60"
          >
            {status === "loading" ? "Зберігаємо…" : "Зберегти пароль"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-v2-mute">
          <Link href="/?auth=login" className="font-medium text-v2-clay hover:underline">
            Повернутись до входу
          </Link>
        </p>
      </div>
    </main>
  );
}
