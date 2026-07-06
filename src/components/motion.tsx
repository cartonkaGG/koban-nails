"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

type MotionProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li" | "h1" | "p";
} & Pick<React.HTMLAttributes<HTMLElement>, "aria-label" | "aria-hidden">;

function useMotionSafe() {
  return useReducedMotion();
}

export function MotionFadeUp({ children, className, delay = 0, as = "div" }: MotionProps) {
  const reduced = useMotionSafe();
  const Tag = motion[as];

  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={fadeUp}
      transition={{ duration: 0.55, ease, delay }}
    >
      {children}
    </Tag>
  );
}

export function MotionStagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useMotionSafe();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-32px" }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useMotionSafe();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={fadeUp} transition={{ duration: 0.5, ease }}>
      {children}
    </motion.div>
  );
}

export function MotionHeroLine({ children, className, delay = 0, as = "div", ...rest }: MotionProps) {
  const reduced = useMotionSafe();
  const Component = as;

  if (reduced) {
    return (
      <Component className={className} {...rest}>
        {children}
      </Component>
    );
  }

  const MotionComponent = motion[as === "h1" || as === "p" ? as : "div"] as typeof motion.div;

  return (
    <MotionComponent
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease, delay }}
      {...rest}
    >
      {children}
    </MotionComponent>
  );
}

export function MotionPage({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useMotionSafe();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const reduced = useMotionSafe();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
