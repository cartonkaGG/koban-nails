import { revalidatePath, revalidateTag } from "next/cache";

/** Bust homepage + course storefront pages after admin changes. */
export function revalidateCoursesCatalog(slug?: string | null) {
  revalidateTag("courses");
  revalidatePath("/");
  revalidatePath("/courses", "layout");
  revalidatePath("/checkout", "layout");

  if (slug?.trim()) {
    const safe = slug.trim();
    revalidatePath(`/courses/${safe}`);
    revalidatePath(`/checkout/${safe}`);
  }
}
