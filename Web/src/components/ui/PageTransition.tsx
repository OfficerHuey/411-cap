import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useReducedMotion } from "../../hooks/useReducedMotion";

//opacity-only page transitions
//rationale: any transform on this wrapper becomes the containing block for
//position:fixed descendants, which breaks viewport layout on route change
//opacity creates no containing block
const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

const variants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: EASE } },
};

const reducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const reduced = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={reduced ? reducedVariants : variants}
        style={{ willChange: "opacity" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
