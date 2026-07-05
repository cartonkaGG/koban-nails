"use client";

import { Ref, forwardRef, useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { motion } from "framer-motion";
import { SmoothAnchor } from "@/components/landing/smooth-anchor";
import { MotionFadeUp } from "@/components/motion";

type Direction = "left" | "right";

const STUDENT_PHOTOS = [
  {
    id: 1,
    order: 0,
    xDesktop: "-320px",
    xMobile: "-128px",
    y: "12px",
    zIndex: 50,
    direction: "left" as Direction,
    src: "/gallery/student-1.png",
    alt: "Випускниця курсу з сертифікатом разом із Галиною Кобан",
  },
  {
    id: 2,
    order: 1,
    xDesktop: "-160px",
    xMobile: "-64px",
    y: "28px",
    zIndex: 40,
    direction: "left" as Direction,
    src: "/gallery/student-2.png",
    alt: "Випускниця з сертифікатом та подарунком",
  },
  {
    id: 3,
    order: 2,
    xDesktop: "0px",
    xMobile: "0px",
    y: "6px",
    zIndex: 30,
    direction: "right" as Direction,
    src: "/gallery/student-3.png",
    alt: "Випускниця курсу з сертифікатом",
  },
  {
    id: 4,
    order: 3,
    xDesktop: "160px",
    xMobile: "64px",
    y: "20px",
    zIndex: 20,
    direction: "right" as Direction,
    src: "/gallery/student-4.png",
    alt: "Випускниця після завершення навчання",
  },
  {
    id: 5,
    order: 4,
    xDesktop: "320px",
    xMobile: "128px",
    y: "36px",
    zIndex: 10,
    direction: "left" as Direction,
    src: "/gallery/student-5.png",
    alt: "Випускниці з сертифікатом у студії Koban",
  },
];

export function StudentGallery({ animationDelay = 0.3 }: { animationDelay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const visibilityTimer = setTimeout(() => setIsVisible(true), animationDelay * 1000);
    const animationTimer = setTimeout(
      () => setIsLoaded(true),
      (animationDelay + 0.35) * 1000,
    );

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(animationTimer);
    };
  }, [animationDelay]);

  const photoWidth = isDesktop ? 200 : 128;
  const photoHeight = isDesktop ? 280 : 180;

  return (
    <section id="graduates" className="student-gallery">
      <div className="student-gallery-grid" aria-hidden="true" />

      <div className="shell relative">
        <MotionFadeUp className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">випускниці</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl md:text-5xl">
            Після курсу — <span className="text-gold">сертифікат</span> і впевненість
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-cream-body">
            Кожна випускниця проходить навчання з особистим супроводом. Перетягніть фото — це наші
            реальні учениці.
          </p>
        </MotionFadeUp>

        <div className="student-gallery-stage">
          <motion.div
            className="relative mx-auto flex w-full max-w-7xl justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <motion.div
              className="relative flex w-full justify-center"
              variants={{
                hidden: { opacity: 1 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.12, delayChildren: 0.08 },
                },
              }}
              initial="hidden"
              animate={isLoaded ? "visible" : "hidden"}
            >
              <div
                className="relative"
                style={{ width: photoWidth, height: photoHeight }}
              >
                {[...STUDENT_PHOTOS].reverse().map((photo) => (
                  <motion.div
                    key={photo.id}
                    className="absolute left-0 top-0"
                    style={{ zIndex: photo.zIndex }}
                    variants={{
                      hidden: { x: 0, y: 0, scale: 1 },
                      visible: {
                        x: isDesktop ? photo.xDesktop : photo.xMobile,
                        y: photo.y,
                        scale: 1,
                        transition: {
                          type: "spring",
                          stiffness: 72,
                          damping: 14,
                          mass: 1,
                          delay: photo.order * 0.12,
                        },
                      },
                    }}
                  >
                    <GalleryPhoto
                      width={photoWidth}
                      height={photoHeight}
                      src={photo.src}
                      alt={photo.alt}
                      direction={photo.direction}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-2 flex justify-center">
          <SmoothAnchor id="courses" className="landing-btn landing-btn-sell">
            Обрати курс
          </SmoothAnchor>
        </div>
      </div>
    </section>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = () => setMatches(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

function randomRotation(direction: Direction) {
  const base = Math.random() * 3 + 1;
  return base * (direction === "left" ? -1 : 1);
}

const MotionImage = motion(
  forwardRef(function MotionImage({ alt = "", ...props }: ImageProps, ref: Ref<HTMLImageElement>) {
    return <Image ref={ref} alt={alt} {...props} />;
  }),
);

function GalleryPhoto({
  src,
  alt,
  direction,
  width,
  height,
}: {
  src: string;
  alt: string;
  direction: Direction;
  width: number;
  height: number;
}) {
  const [rotation, setRotation] = useState(() => randomRotation(direction));

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.12}
      whileTap={{ scale: 1.06, zIndex: 9999 }}
      whileHover={{
        scale: 1.05,
        rotateZ: 2 * (direction === "left" ? -1 : 1),
        zIndex: 9999,
      }}
      whileDrag={{ scale: 1.05, zIndex: 9999 }}
      animate={{ rotate: rotation }}
      style={{
        width,
        height,
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "none",
      }}
      className="gallery-photo relative mx-auto shrink-0 cursor-grab active:cursor-grabbing"
      draggable={false}
      tabIndex={0}
    >
      <div className="gallery-photo-frame">
        <MotionImage
          className="object-cover object-top"
          fill
          src={src}
          alt={alt}
          sizes="(max-width: 768px) 128px, 200px"
          draggable={false}
        />
      </div>
    </motion.div>
  );
}
