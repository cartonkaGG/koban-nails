"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthModal } from "@/components/auth/auth-modal-context";

type Message = {
  id: string;
  body: string;
  direction: "user" | "admin";
  created_at: string;
};

const POLL_OPEN_MS = 3000;
const POLL_CLOSED_MS = 15000;

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
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [threadStatus, setThreadStatus] = useState<"open" | "closed">("open");
  const listRef = useRef<HTMLDivElement>(null);
  const { openAuth } = useAuthModal();

  const checkUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/support/unread", { cache: "no-store" });
      const data = await res.json();
      if (data.loggedIn) {
        setLoggedIn(true);
        setUnreadCount(data.unreadCount ?? 0);
      } else {
        setLoggedIn(false);
        setUnreadCount(0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadMessages = useCallback(async () => {
    const res = await fetch("/api/support", { cache: "no-store" });
    if (res.status === 401) {
      setLoggedIn(false);
      setUnreadCount(0);
      return;
    }
    setLoggedIn(true);
    const data = await res.json();
    setMessages(data.messages ?? []);
    setUnreadCount(data.unreadCount ?? 0);
    setThreadStatus(data.status === "closed" ? "closed" : "open");
  }, []);

  const markRead = useCallback(async () => {
    await fetch("/api/support/read", { method: "POST" });
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    checkUnread();
    if (loggedIn === false) return;
    const timer = setInterval(checkUnread, open ? POLL_OPEN_MS : POLL_CLOSED_MS);
    return () => clearInterval(timer);
  }, [open, checkUnread, loggedIn]);

  useEffect(() => {
    if (unreadCount <= 0) return;
    void loadMessages();
    setThreadStatus("open");
  }, [unreadCount, loadMessages]);

  useEffect(() => {
    if (!open) return;
    loadMessages();
    markRead();
    const timer = setInterval(loadMessages, POLL_OPEN_MS);
    return () => clearInterval(timer);
  }, [open, loadMessages, markRead]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, threadStatus]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;

    if (loggedIn === false) {
      openAuth({ mode: "login" });
      return;
    }

    setSending(true);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);

    if (res.ok) {
      setText("");
      setThreadStatus("open");
      await loadMessages();
    }
  }

  async function closeChat() {
    if (closing || loggedIn === false) return;
    setClosing(true);
    const res = await fetch("/api/support/close", { method: "POST" });
    setClosing(false);
    if (res.ok) {
      setMessages([]);
      setUnreadCount(0);
      setThreadStatus("closed");
    }
  }

  function toggleOpen() {
    setOpen((value) => {
      const next = !value;
      if (next) {
        void markRead();
        void loadMessages();
      }
      return next;
    });
  }

  const isClosed = threadStatus === "closed";

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
        <div className="support-chat-panel" role="dialog" aria-label="Чат підтримки">
          <div className="support-chat-head">
            <strong>Підтримка Koban nails</strong>
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
            {loggedIn === false && (
              <p className="support-chat-hint">
                Увійдіть, щоб написати в підтримку. Відповідь прийде сюди.
              </p>
            )}
            {isClosed && loggedIn !== false && (
              <p className="support-chat-closed-state">Чат завершено</p>
            )}
            {messages.length === 0 && loggedIn !== false && !isClosed && (
              <p className="support-chat-hint">Напишіть питання — відповімо якнайшвидше.</p>
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
            {!isClosed && loggedIn !== false && (
              <button type="button" className="support-chat-close-thread" onClick={closeChat} disabled={closing}>
                {closing ? "..." : "Завершити чат"}
              </button>
            )}
            <div className="support-chat-input">
              <input
                className="field"
                placeholder={
                  loggedIn === false
                    ? "Спочатку увійдіть..."
                    : isClosed
                      ? "Нове звернення..."
                      : "Ваше повідомлення..."
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
              <button type="button" className="btn btn-primary min-h-10 px-4" onClick={send} disabled={sending}>
                {sending ? "..." : "→"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
