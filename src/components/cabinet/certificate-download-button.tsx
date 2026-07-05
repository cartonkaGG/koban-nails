"use client";

import { useState } from "react";

type Props = {
  courseSlug: string;
  disabled?: boolean;
  compact?: boolean;
};

export function CertificateDownloadButton({ courseSlug, disabled, compact }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/certificates/${courseSlug}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Не вдалося згенерувати сертифікат");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const fileName = match?.[1] ?? `certificate-${courseSlug}.pdf`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Помилка завантаження");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "certificate-download-compact" : "certificate-download"}>
      <button
        type="button"
        className={compact ? "btn btn-ghost min-h-9 px-3 text-xs" : "btn btn-primary certificate-download-btn"}
        onClick={() => void download()}
        disabled={disabled || loading}
      >
        {loading ? "Генеруємо PDF..." : "Завантажити сертифікат"}
      </button>
      {error && <p className="certificate-download-error">{error}</p>}
    </div>
  );
}
