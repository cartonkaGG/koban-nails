"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthModal } from "@/components/auth/auth-modal-context";

type Message = {
  id: string;
  body: string;
  direction: "user" | "admin";
  created_at: string;
};

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { openAuth } = useAuthModal();

  const loadMessages = useCallback(async () => {
    const res = await fetch("/api/support");
    if (res.status === 401) {
      setLoggedIn(false);
      return;
    }
    setLoggedIn(true);
    const data = await res.json();
    setMessages(data.messages ?? []);
  }, []);

  useEffect(() => {
    if (!open) return;
    loadMessages();
    const timer = setInterval(loadMessages, 4000);
    return () => clearInterval(timer);
  }, [open, loadMessages]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

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
      await loadMessages();
    }
  }

  return (
    <>
      <button
        type="button"
        className="support-chat-fab"
        aria-label="Підтримка"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="support-chat-panel" role="dialog" aria-label="Чат підтримки">
          <div className="support-chat-head">
            <strong>Підтримка</strong>
            <button type="button" className="support-chat-close" onClick={() => setOpen(false)} aria-label="Закрити">
              ×
            </button>
          </div>

          <div className="support-chat-messages" ref={listRef}>
            {loggedIn === false && (
              <p className="support-chat-hint">
                Увійдіть, щоб написати в підтримку. Відповідь прийде сюди.
              </p>
            )}
            {messages.length === 0 && loggedIn !== false && (
              <p className="support-chat-hint">Напишіть питання — відповімо якнайшвидше.</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`support-chat-bubble ${msg.direction === "user" ? "mine" : "theirs"}`}
              >
                {msg.body}
              </div>
            ))}
          </div>

          <div className="support-chat-input">
            <input
              className="field"
              placeholder={loggedIn === false ? "Спочатку увійдіть..." : "Ваше повідомлення..."}
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
      )}
    </>
  );
}
