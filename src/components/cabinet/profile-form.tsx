"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { CabinetShell } from "@/components/cabinet/cabinet-shell";

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
    setMessage(res.ok ? "Збережено" : "Не вдалося зберегти");
  }

  return (
    <CabinetShell profile={profile}>
      <div className="cabinet-intro">
        <h1 className="cabinet-title">Профіль</h1>
        <p className="cabinet-subtitle">Ім&apos;я використовується на сертифікаті після курсу.</p>
      </div>

      <div className="cabinet-profile-card">
        <label className="cabinet-field">
          <span>Email</span>
          <input className="field" value={profile.email} disabled />
        </label>
        <label className="cabinet-field">
          <span>Ім&apos;я та прізвище</span>
          <input className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className="cabinet-field">
          <span>Телефон</span>
          <input
            className="field"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+380..."
          />
        </label>
        {message && <p className="text-sm text-gold">{message}</p>}
        <button type="button" className="btn btn-primary" onClick={save}>
          Зберегти
        </button>
      </div>
    </CabinetShell>
  );
}
