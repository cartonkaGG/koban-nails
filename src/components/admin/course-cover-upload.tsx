"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { resolveCourseImageUrl } from "@/lib/images";

type Props = {
  courseId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  onSaved?: (url: string | null) => void;
};

export function CourseCoverUpload({ courseId, value, onChange, onSaved }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const preview = resolveCourseImageUrl(value);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Оберіть зображення (JPG, PNG, WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Файл занадто великий (макс. 10 МБ)");
      return;
    }

    setError("");
    setUploading(true);
    setProgress("Завантаження...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);

      const res = await fetch("/api/admin/course-image", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as {
        error?: string;
        storagePath?: string;
        publicUrl?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Помилка завантаження");
        return;
      }

      const storedUrl = data.storagePath ?? data.publicUrl ?? null;
      onChange(storedUrl);
      onSaved?.(storedUrl);
      setProgress("Готово");
    } catch {
      setError("Не вдалося завантажити зображення");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="course-cover-upload space-y-4">
      <div
        className={`course-cover-drop ${dragOver ? "course-cover-drop-active" : ""} ${preview ? "course-cover-drop-has-image" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />

        {preview ? (
          <div className="course-cover-preview">
            <Image src={preview} alt="Обкладинка курсу" fill className="object-cover" sizes="(max-width: 768px) 100vw, 480px" />
            <div className="course-cover-overlay">
              <span>{uploading ? progress : "Натисніть або перетягніть нове фото"}</span>
            </div>
          </div>
        ) : (
          <div className="course-cover-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
              <path d="M21 16l-5.5-5.5a1 1 0 00-1.4 0L3 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="mt-3 text-sm font-medium text-cream">Додати обкладинку</p>
            <p className="mt-1 text-xs text-muted">Перетягніть JPG, PNG або WebP · до 10 МБ</p>
            {uploading && <p className="mt-2 text-xs text-gold">{progress}</p>}
          </div>
        )}
      </div>

      <label className="block text-sm">
        <span className="mb-2 block text-muted">Або вставте посилання на зображення</span>
        <input
          className="field"
          placeholder="https://..."
          value={value && !value.startsWith("storage:") ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={uploading}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        {preview && (
          <button
            type="button"
            className="btn btn-ghost min-h-9 px-3 text-xs text-red-300"
            disabled={uploading}
            onClick={() => onChange(null)}
          >
            Видалити обкладинку
          </button>
        )}
        {error && <span className="text-xs text-red-300">{error}</span>}
      </div>
    </div>
  );
}
