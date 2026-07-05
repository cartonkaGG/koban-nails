import { getSupabaseEnv } from "@/lib/supabase/config";

export function isStorageImage(url: string | null | undefined) {
  return Boolean(url?.startsWith("storage:"));
}

export function getStorageImagePath(url: string) {
  return url.replace(/^storage:/, "");
}

/** Resolve course image for next/image — public URL, storage path, or local path. */
export function resolveCourseImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (isStorageImage(url)) {
    const { url: supabaseUrl } = getSupabaseEnv();
    if (!supabaseUrl) return null;
    return `${supabaseUrl}/storage/v1/object/public/course-images/${getStorageImagePath(url)}`;
  }
  return url;
}
