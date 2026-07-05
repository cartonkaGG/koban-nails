import type { Course } from "@/lib/types";
import { formatPrice, getEffectiveCoursePrice, isCourseOnSale } from "@/lib/types";

type Props = {
  course: Course;
  size?: "sm" | "lg";
  className?: string;
};

export function CoursePrice({ course, size = "sm", className = "" }: Props) {
  const onSale = isCourseOnSale(course);
  const effective = getEffectiveCoursePrice(course);

  if (size === "lg") {
    return (
      <div className={`course-price course-price-lg ${className}`}>
        {onSale ? (
          <>
            <span className="course-price-old">{formatPrice(course.price_uah)}</span>
            <span className="course-price-sale">{formatPrice(effective)}</span>
            <span className="course-price-sale-badge">Акція</span>
          </>
        ) : (
          <span className="course-price-regular">{formatPrice(effective)}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`course-price course-price-sm ${className}`}>
      {onSale ? (
        <>
          <span className="course-price-old">{formatPrice(course.price_uah)}</span>
          <span className="course-card-price course-card-price-sale">{formatPrice(effective)}</span>
        </>
      ) : (
        <span className="course-card-price">{formatPrice(effective)}</span>
      )}
    </div>
  );
}
