import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const variants = {
  initial: prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 12 },
  animate: prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0 },
  exit: prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -8 },
};

const transition = {
  duration: prefersReducedMotion ? 0.15 : 0.35,
  ease: [0.19, 1, 0.22, 1] as [number, number, number, number],
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
