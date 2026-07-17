"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type AuthMode = "login" | "register" | "forgot";
type Status = "idle" | "loading" | "success" | "error";

type Props = {
  open: boolean;
  mode: "login" | "register";
  redirectTo: string;
  onClose: () => void;
};

export function AuthModal({ open, mode: initialMode, redirectTo, onClose }: Props) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const supabaseReady = isSupabaseConfigured();
  const isCheckoutFlow = redirectTo.includes("/checkout/");

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, open]);

  useEffect(() => {
    if (open) return;
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setAcceptedTerms(false);
    setStatus("idle");
    setSuccessMessage("");
    setPendingConfirmation(false);
    setIsBusy(false);
    setError("");
    setShowPassword(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("auth-modal-open");
    return () => document.body.classList.remove("auth-modal-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function authRequest(
    path: "/api/auth/login" | "/api/auth/register",
    repairUnconfirmedOnly = false,
  ) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          acceptTerms: acceptedTerms,
          redirectTo,
          repairUnconfirmedOnly,
        }),
        signal: controller.signal,
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; redirectTo?: string; needsEmailConfirmation?: boolean; message?: string }
        | null;

      return {
        ok: response.ok,
        error: result?.error,
        redirectTo: result?.redirectTo ?? redirectTo,
        status: response.status,
        needsEmailConfirmation: result?.needsEmailConfirmation,
        message: result?.message,
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

    window.location.assign(role === "admin" ? "/admin" : redirectTo);
  }

  async function onForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;

      if (!response.ok) {
        setStatus("error");
        setError(result?.error ?? "Не вдалося надіслати лист.");
        return;
      }

      setStatus("success");
      setSuccessMessage(
        result?.message ?? "Якщо акаунт існує, ми надіслали лист для зміни пароля.",
      );
    } catch {
      setStatus("error");
      setError("Не вдалося надіслати лист. Спробуйте ще раз.");
    }
  }

  async function resendConfirmation() {
    setIsBusy(true);
    setError("");

    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          redirectTo,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        setStatus("error");
        setError(result?.error ?? "Не вдалося надіслати лист повторно.");
        setIsBusy(false);
        return;
      }

      setStatus("success");
      setSuccessMessage(result?.message ?? `Лист повторно надіслано на ${email}.`);
      setIsBusy(false);
    } catch {
      setStatus("error");
      setError("Не вдалося надіслати лист повторно.");
      setIsBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    setSuccessMessage("");

    if (mode === "register" && (!firstName.trim() || !lastName.trim())) {
      setStatus("error");
      setError("Вкажіть ім'я та прізвище — вони потрібні для сертифіката.");
      return;
    }

    if (mode === "register" && !acceptedTerms) {
      setStatus("error");
      setError("Щоб створити акаунт, погодьтесь з умовами користування та політикою конфіденційності.");
      return;
    }

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
            setStatus("error");
            setError("Акаунт уже існує. Увійдіть або відновіть пароль.");
            return;
          }

          setStatus("error");
          setError(registerResult.error ?? "Не вдалося створити акаунт.");
          return;
        }

        if (registerResult.needsEmailConfirmation) {
          setPendingConfirmation(true);
          setStatus("success");
          setSuccessMessage(
            registerResult.message ??
              "Перевірте пошту — ми надіслали лист для підтвердження email.",
          );
          return;
        }

        window.location.assign(registerResult.redirectTo);
        return;
      }

      const loginResult = await authRequest("/api/auth/login");

      if (!loginResult.ok) {
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

  if (!open) return null;

  const isIcloudEmail = /@(icloud|me|mac)\.com$/i.test(email.trim());

  if (pendingConfirmation) {
    return (
      <div className="auth-modal-root" role="presentation">
        <button type="button" className="auth-modal-backdrop" aria-label="Закрити" onClick={onClose} />
        <div
          className="auth-modal-panel auth-modal-panel--confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-confirm-title"
        >
          <button type="button" className="auth-modal-close" aria-label="Закрити" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="auth-confirm-screen">
            <div className="auth-confirm-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6h16v12H4V6zm2 2v8h12V8H6zm2 1h8v2H8V9zm0 3h5v2H8v-2z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div>
              <p className="v2-eyebrow">Майже готово</p>
              <h2 id="auth-confirm-title" className="v2-modal-title mt-2 text-2xl">
                Підтвердіть email
              </h2>
              <p className="v2-modal-subtitle mt-3">
                Ми надіслали лист на
                <span className="auth-confirm-email">{email}</span>
              </p>
            </div>

            <ul className="auth-confirm-tips">
              <li>Відкрийте лист і натисніть «Підтвердити email» — ви одразу потрапите в кабінет, повторно вводити пароль не потрібно.</li>
              <li>
                {isIcloudEmail
                  ? "Для iCloud перевірте папку «Небажана пошта» (Junk) та «Спам» — листи з нових доменів часто потрапляють туди."
                  : "Якщо листа немає у «Вхідних», перевірте «Спам» або «Небажана пошта» (Junk)."}
              </li>
              <li>Доставка може зайняти 1–3 хвилини. «Надіслано» означає, що лист передано поштовому серверу — не завжди, що він уже у вхідних.</li>
            </ul>

            {status === "success" && successMessage && (
              <p className="v2-alert-success text-sm">{successMessage}</p>
            )}
            {error && <p className="v2-alert-error text-sm">{error}</p>}

            <button
              type="button"
              className="v2-btn-primary w-full"
              disabled={isBusy}
              onClick={resendConfirmation}
            >
              {isBusy ? "Надсилаємо..." : "Надіслати лист ще раз"}
            </button>

            <button
              type="button"
              className="text-sm font-semibold text-v2-mute transition hover:text-v2-clay"
              onClick={() => {
                setPendingConfirmation(false);
                setStatus("idle");
                setSuccessMessage("");
                setError("");
              }}
            >
              ← Змінити email
            </button>
          </div>
        </div>
      </div>
    );
  }

  const title =
    mode === "forgot" ? "Зміна пароля" : mode === "login" ? "Вхід" : "Створити акаунт";

  return (
    <div className="auth-modal-root" role="presentation">
      <button type="button" className="auth-modal-backdrop" aria-label="Закрити" onClick={onClose} />
      <div
        className="auth-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button type="button" className="auth-modal-close" aria-label="Закрити" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <p className="v2-eyebrow">
          {mode === "forgot" ? "Відновлення" : mode === "login" ? "Ласкаво просимо" : "Приєднуйтесь"}
        </p>
        <h2 id="auth-modal-title" className="v2-modal-title mt-2 text-2xl sm:text-3xl">
          {title}
        </h2>
        <p className="v2-modal-subtitle mt-3">
          {mode === "forgot"
            ? "Введіть email — надішлемо посилання для створення нового пароля."
            : isCheckoutFlow
              ? "Увійдіть або зареєструйтесь, щоб продовжити покупку курсу."
              : supabaseReady
                ? mode === "register"
                  ? "Вкажіть ім'я та прізвище — вони з'являться на сертифікаті. Після реєстрації підтвердіть email."
                  : "Увійдіть через email і пароль."
                : "Демо-режим: email і будь-який пароль. Email з admin — адмін-панель."}
        </p>

        {mode !== "forgot" && (
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-v2-sand p-1 text-sm">
            <button
              type="button"
              className={`rounded-full px-3 py-2 font-semibold transition ${mode === "login" ? "bg-v2-clay text-white shadow-v2-card" : "text-v2-ink-soft hover:text-v2-ink"}`}
              onClick={() => {
                setMode("login");
                setStatus("idle");
                setError("");
                setSuccessMessage("");
              }}
            >
              Увійти
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-2 font-semibold transition ${mode === "register" ? "bg-v2-clay text-white shadow-v2-card" : "text-v2-ink-soft hover:text-v2-ink"}`}
              onClick={() => {
                setMode("register");
                setStatus("idle");
                setError("");
                setSuccessMessage("");
              }}
            >
              Реєстрація
            </button>
          </div>
        )}

        {mode === "forgot" ? (
          <form className="mt-6 space-y-4" onSubmit={onForgotSubmit}>
            <div>
              <label className="v2-label">Email</label>
              <input
                type="email"
                required
                className="v2-field"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <button type="submit" className="v2-btn-primary" disabled={status === "loading"}>
              {status === "loading" ? "Зачекайте..." : "Надіслати лист"}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm font-semibold text-v2-mute transition hover:text-v2-clay"
              onClick={() => {
                setMode("login");
                setStatus("idle");
                setError("");
                setSuccessMessage("");
              }}
            >
              ← Повернутися до входу
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit} autoComplete="off">
            {mode === "register" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="v2-label">Ім&apos;я</label>
                  <input
                    type="text"
                    required
                    className="v2-field"
                    placeholder=""
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="off"
                    name="koban-register-first-name"
                  />
                </div>
                <div>
                  <label className="v2-label">Прізвище</label>
                  <input
                    type="text"
                    required
                    className="v2-field"
                    placeholder=""
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="off"
                    name="koban-register-last-name"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="v2-label">Email</label>
              <input
                type="email"
                required
                className="v2-field"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="v2-label">Пароль</label>
              <span className="relative block">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="v2-field pr-12"
                  placeholder="Мінімум 6 символів"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-v2-mute transition hover:bg-v2-sand hover:text-v2-clay"
                  aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.3A8.8 8.8 0 0112 5c5 0 8 4.5 9 7a12.8 12.8 0 01-2.2 3.3M6.5 6.5A13.5 13.5 0 003 12c1 2.5 4 7 9 7 1.6 0 3-.5 4.2-1.2" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.8 12S6 5 12 5s9.2 7 9.2 7S18 19 12 19s-9.2-7-9.2-7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  )}
                </button>
              </span>
            </div>
            {mode === "login" && supabaseReady && (
              <button
                type="button"
                className="v2-modal-link text-sm"
                onClick={() => {
                  setMode("forgot");
                  setStatus("idle");
                  setError("");
                  setSuccessMessage("");
                }}
              >
                Забули пароль?
              </button>
            )}
            {mode === "register" && (
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-v2-mute">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-[#C97F72]"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  required
                />
                <span>
                  Я погоджуюсь з{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-v2-clay underline-offset-2 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    умовами користування
                  </Link>
                  {" "}та{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-v2-clay underline-offset-2 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    політикою конфіденційності
                  </Link>
                  .
                </span>
              </label>
            )}
            <button type="submit" className="v2-btn-primary" disabled={status === "loading"}>
              {status === "loading" ? "Зачекайте..." : mode === "login" ? "Увійти" : "Створити акаунт"}
            </button>
          </form>
        )}

        {mode === "forgot" && status === "success" && successMessage && (
          <p className="v2-alert-success mt-4">{successMessage}</p>
        )}
        {error && <p className="v2-alert-error mt-4">{error}</p>}
      </div>
    </div>
  );
}
