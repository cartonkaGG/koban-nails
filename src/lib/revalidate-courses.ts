import { revalidatePath, revalidateTag } from "next/cache";

/** Bust homepage + course storefront pages after admin changes. */
export function revalidateCoursesCatalog(slug?: string | null) {
  revalidateTag("courses");

  // Invalidate both page and layout caches — homepage ISR can keep stale HTML
  // even after a data-tag purge if only one of these is called.
  revalidatePath("/", "layout");
  revalidatePath("/", "page");
  revalidatePath("/courses", "layout");
  revalidatePath("/checkout", "layout");
  revalidatePath("/sitemap.xml");

  if (slug?.trim()) {
    const safe = slug.trim();
    revalidatePath(`/courses/${safe}`, "page");
    revalidatePath(`/checkout/${safe}`, "page");
  }
}
