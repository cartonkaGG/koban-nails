"use client";

import { useEffect, useState } from "react";
import {
  isEmbedVideo,
  isNativeVideo,
  isStorageVideo,
  resolveVideoEmbed,
} from "@/lib/video";

export function LessonVideo({
  lessonId,
  videoUrl,
  title,
}: {
  lessonId: string;
  videoUrl: string | null;
  title: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError("");
      setSrc(null);

      if (!videoUrl) return;

      if (isEmbedVideo(videoUrl)) {
        setSrc(resolveVideoEmbed(videoUrl));
        return;
      }

      if (isNativeVideo(videoUrl) && isStorageVideo(videoUrl)) {
        setLoading(true);
        try {
          const res = await fetch(`/api/lessons/${lessonId}/video`);
          const data = await res.json();
          if (!cancelled) {
            if (res.ok && data.url) setSrc(data.url);
            else setError("Не вдалося завантажити відео");
          }
        } catch {
          if (!cancelled) setError("Не вдалося завантажити відео");
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      if (isNativeVideo(videoUrl)) {
        setSrc(videoUrl);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lessonId, videoUrl]);

  if (!videoUrl) {
    return (
      <div className="cabinet-lesson-media-empty">
        <p>Відео буде додано незабаром</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cabinet-lesson-media-empty">
        <p>Завантаження відео...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cabinet-lesson-media-empty">
        <p>{error}</p>
      </div>
    );
  }

  if (src && isEmbedVideo(videoUrl)) {
    return (
      <iframe
        src={src}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (src) {
    return (
      <video
        key={src}
        src={src}
        className="lesson-video-native"
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload"
      >
        <track kind="captions" />
      </video>
    );
  }

  return (
    <div className="cabinet-lesson-media-empty">
      <p>Відео недоступне</p>
    </div>
  );
}
