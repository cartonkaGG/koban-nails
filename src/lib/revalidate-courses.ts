import { revalidatePath, revalidateTag } from "next/cache";

/** Bust homepage course list after admin changes. */
export function revalidateCoursesCatalog() {
  revalidateTag("courses");
  revalidatePath("/");
}
