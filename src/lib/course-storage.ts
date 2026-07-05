import type { SupabaseClient } from "@supabase/supabase-js";

const IMAGE_BUCKET = "course-images";
const VIDEO_BUCKET = "course-videos";

async function removeStorageFolder(
  supabase: SupabaseClient,
  bucket: string,
  folder: string,
) {
  const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: 1000 });
  if (error || !data?.length) return;

  const filePaths: string[] = [];

  for (const item of data) {
    const path = `${folder}/${item.name}`;
    if (item.id) {
      filePaths.push(path);
    } else {
      await removeStorageFolder(supabase, bucket, path);
    }
  }

  if (filePaths.length > 0) {
    await supabase.storage.from(bucket).remove(filePaths);
  }
}

export async function removeCourseStorage(supabase: SupabaseClient, courseId: string) {
  await Promise.all([
    removeStorageFolder(supabase, IMAGE_BUCKET, courseId),
    removeStorageFolder(supabase, VIDEO_BUCKET, courseId),
  ]);
}
