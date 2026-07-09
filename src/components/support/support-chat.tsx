"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  body: string;
  direction: "user" | "admin";
  created_at: string;
};

const POLL_OPEN_MS = 3000;
const POLL_CLOSED_MS = 12000;
const GUEST_NAME_KEY = "support_guest_name";
const GUEST_ID_KEY = "support_guest_id";

function readStoredGuestId() {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(GUEST_ID_KEY);
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

/** Stable guest id before any API call — avoids parallel requests each minting a new UUID. */
function ensureGuestId() {
  const existing = readStoredGuestId();
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(GUEST_ID_KEY, id);
  return id;
}

function persistGuestId(guestId: unknown) {
  if (typeof guestId !== "string" || !/^[0-9a-f-]{36}$/i.test(guestId)) return;
  const current = readStoredGuestId();
  if (current && current !== guestId) return;
  localStorage.setItem(GUEST_ID_KEY, guestId);
}

function supportFetchInit(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers);
  headers.set("x-support-guest-id", ensureGuestId());
  return { ...init, headers, credentials: "include" };
}

async function parseSupportResponse<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { guestId?: string };
  persistGuestId(data.guestId);
  return data;
}

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState<"user" | "guest">("guest");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [ready, setReady] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [threadStatus, setThreadStatus] = useState<"open" | "closed">("open");
  const [sendError, setSendError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ensureGuestId();
    const saved = localStorage.getItem(GUEST_NAME_KEY);
    if (saved) setGuestName(saved);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.classList.add("support-chat-open");
      return () => document.body.classList.remove("support-chat-open");
    }
  }, [open]);

  const checkUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/support/unread", supportFetchInit({ cache: "no-store" }));
      const data = await parseSupportResponse<{ unreadCount?: number; mode?: "user" | "guest" }>(res);
      setUnreadCount(data.unreadCount ?? 0);
      if (data.mode) setMode(data.mode);
    } catch {
      /* ignore */
    }
  }, []);

  const loadMessages = useCallback(async () => {
    const res = await fetch("/api/support", supportFetchInit({ cache: "no-store" }));
    if (!res.ok) return;

    setReady(true);
    const data = await parseSupportResponse<{
      messages?: Message[];
      unreadCount?: number;
      status?: string;
      mode?: "user" | "guest";
      displayName?: string;
    }>(res);
    setMessages(data.messages ?? []);
    setUnreadCount(data.unreadCount ?? 0);
    setThreadStatus(data.status === "closed" ? "closed" : "open");
    if (data.mode) setMode(data.mode);
    if (data.displayName) setDisplayName(data.displayName);
  }, []);

  const markRead = useCallback(async () => {
    await fetch("/api/support/read", supportFetchInit({ method: "POST" }));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    checkUnread();
    const timer = setInterval(checkUnread, open ? POLL_OPEN_MS : POLL_CLOSED_MS);
    return () => clearInterval(timer);
  }, [open, checkUnread]);

  useEffect(() => {
    if (unreadCount <= 0) return;
    void loadMessages();
    setThreadStatus("open");
  }, [unreadCount, loadMessages]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      await loadMessages();
      if (!cancelled) await markRead();
    })();
    const timer = setInterval(() => void loadMessages(), POLL_OPEN_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [open, loadMessages, markRead]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, threadStatus]);

  useEffect(() => {
    if (open && inputRef.current && threadStatus !== "closed") {
      inputRef.current.focus();
    }
  }, [open, threadStatus]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setSendError("");
    const payload: { body: string; name?: string } = { body };
    if (mode === "guest" && guestName.trim()) {
      payload.name = guestName.trim();
      localStorage.setItem(GUEST_NAME_KEY, guestName.trim());
    }

    const res = await fetch(
      "/api/support",
      supportFetchInit({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    setSending(false);

    if (res.ok) {
      setText("");
      setThreadStatus("open");
      if (payload.name) setDisplayName(payload.name);
      await parseSupportResponse(res);
      await loadMessages();
      return;
    }

    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setSendError(data.error ?? "Не вдалося надіслати повідомлення. Спробуйте ще раз.");
  }

  async function closeChat() {
    if (closing) return;
    setClosing(true);
    const res = await fetch("/api/support/close", supportFetchInit({ method: "POST" }));
    setClosing(false);
    if (res.ok) {
      setMessages([]);
      setUnreadCount(0);
      setThreadStatus("closed");
    }
  }

  function toggleOpen() {
    setOpen((value) => !value);
  }

  const isClosed = threadStatus === "closed";
  const showGuestNameField = mode === "guest" && !displayName;

  return (
    <>
      <button
        type="button"
        className="support-chat-fab"
        aria-label={unreadCount > 0 ? `Підтримка: ${unreadCount} нових відповідей` : "Підтримка"}
        onClick={toggleOpen}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="support-chat-badge" aria-hidden="true">
            !
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="support-chat-backdrop"
            aria-label="Закрити чат"
            onClick={() => setOpen(false)}
          />
          <div className="support-chat-panel" role="dialog" aria-label="Чат підтримки">
            <div className="support-chat-head">
              <div className="support-chat-head-text">
                <strong>Підтримка</strong>
                <span>Koban nails · онлайн</span>
              </div>
              <button type="button" className="support-chat-close" onClick={() => setOpen(false)} aria-label="Закрити">
                ×
              </button>
            </div>

            {isClosed && (
              <div className="support-chat-closed-banner">
                Чат завершено. Напишіть нове повідомлення, щоб почати знову.
              </div>
            )}

            <div className="support-chat-messages" ref={listRef}>
              {!ready && <p className="support-chat-hint">Завантаження...</p>}
              {ready && isClosed && (
                <p className="support-chat-closed-state">Чат завершено</p>
              )}
              {ready && messages.length === 0 && !isClosed && (
                <p className="support-chat-hint">
                  Напишіть питання — відповімо якнайшвидше. Реєстрація не потрібна.
                </p>
              )}
              {messages.map((msg) => {
                const isUser = msg.direction === "user";
                return (
                  <div
                    key={msg.id}
                    className={`support-chat-row ${isUser ? "support-chat-row-user" : "support-chat-row-admin"}`}
                  >
                    <div className="support-chat-meta">
                      <span className="support-chat-sender">{isUser ? "Ви" : "Підтримка"}</span>
                      <span className="support-chat-time">{formatTime(msg.created_at)}</span>
                    </div>
                    <div className={`support-chat-bubble ${isUser ? "mine" : "theirs"}`}>
                      {msg.body}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="support-chat-footer">
              {!isClosed && (
                <button type="button" className="support-chat-close-thread" onClick={closeChat} disabled={closing}>
                  {closing ? "..." : "Завершити чат"}
                </button>
              )}

              {showGuestNameField && (
                <input
                  className="field support-chat-name-field"
                  placeholder="Ваше ім'я (необов'язково)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  maxLength={80}
                />
              )}

              {sendError && <p className="support-chat-error">{sendError}</p>}

              <div className="support-chat-input">
                <textarea
                  ref={inputRef}
                  className="field support-chat-textarea"
                  rows={1}
                  placeholder={
                    isClosed
                      ? "Нове звернення..."
                      : "Повідомлення..."
                  }
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary support-chat-send-btn"
                  onClick={send}
                  disabled={sending}
                  aria-label="Надіслати"
                >
                  {sending ? "..." : "↑"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
