const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
];

export function isStorageVideo(url: string | null | undefined) {
  return Boolean(url?.startsWith("storage:"));
}

export function getStoragePath(url: string) {
  return url.replace(/^storage:/, "");
}

export function isEmbedVideo(url: string | null | undefined) {
  if (!url) return false;
  if (isStorageVideo(url)) return false;
  if (/\.(mp4|webm|m4v)(\?|$)/i.test(url)) return false;
  return true;
}

export function isNativeVideo(url: string | null | undefined) {
  if (!url) return false;
  return isStorageVideo(url) || /\.(mp4|webm|m4v)(\?|$)/i.test(url);
}

export function toYoutubeEmbed(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}`;
  }
  if (url.includes("youtube.com/embed/")) return url;
  return null;
}

export function resolveVideoEmbed(url: string): string | null {
  return toYoutubeEmbed(url) ?? (url.includes("embed") ? url : null);
}

export function sanitizeUploadFileName(name: string) {
  return name.replace(/[^\w.\-()+\s]/g, "_").replace(/\s+/g, "-").slice(0, 120);
}
