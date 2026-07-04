"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { CabinetShell } from "@/components/cabinet/cabinet-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [message, setMessage] = useState("");

  async function save() {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, phone }),
    });
    setMessage(res.ok ? "Профіль оновлено" : "Не вдалося зберегти");
  }

  async function logout() {
    if (isSupabaseConfigured()) {
      const { createClient } = await import("@/lib/supabase/client");
      await createClient().auth.signOut();
    } else {
      await fetch("/api/demo-login", { method: "DELETE" });
    }
    window.location.href = "/";
  }

  return (
    <CabinetShell profile={profile}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="eyebrow">акаунт</p>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl">Профіль</h2>
        </div>

        <div className="card space-y-4">
          <label className="block text-sm">
            <span className="mb-2 block text-muted">Email</span>
            <input className="field" value={profile.email} disabled />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block text-muted">Ім&apos;я</span>
            <input className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block text-muted">Телефон</span>
            <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380..." />
          </label>
          {message && <p className="text-sm text-gold">{message}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={save}>Зберегти</button>
            <button type="button" className="btn btn-ghost" onClick={logout}>Вийти</button>
          </div>
        </div>
      </div>
    </CabinetShell>
  );
}
