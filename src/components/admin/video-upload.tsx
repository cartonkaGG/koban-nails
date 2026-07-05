"use client";

import { useRef, useState } from "react";

type Props = {
  lessonId: string;
  value: string;
  onUploaded: (videoUrl: string) => void;
};

export function VideoUploadField({ lessonId, value, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    setProgress("0%");

    try {
      const res = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          fileName: file.name,
          contentType: file.type || "video/mp4",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Помилка підготовки завантаження");
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", data.signedUrl);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setProgress(`${pct}%`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      onUploaded(data.path);
      setProgress("Готово");
    } catch {
      setError("Не вдалося завантажити відео");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="video-upload">
      <label className="block text-sm md:col-span-2">
        <span className="mb-2 block text-muted">Відео уроку</span>
        <input
          className="field"
          placeholder={value.startsWith("storage:") ? "YouTube посилання (опційно)" : "YouTube посилання"}
          value={value.startsWith("storage:") ? "" : value}
          onChange={(e) => onUploaded(e.target.value)}
          disabled={uploading}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="btn btn-ghost min-h-9 px-3 text-xs"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? `Завантаження ${progress}` : "Завантажити MP4"}
        </button>
        {value.startsWith("storage:") && !uploading && (
          <span className="text-xs text-gold">✓ Відео на сервері</span>
        )}
        {error && <span className="text-xs text-red-300">{error}</span>}
      </div>
    </div>
  );
}
