import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useNavigationDirection } from "../../Lib/NavigationDirection";
import { reducedPageVariants } from "../../Lib/motion";

type Direction = "deeper" | "shallower" | "lateral";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

function getVariants(direction: Direction): Variants {
  switch (direction) {
    case "deeper":
      return {
        initial: { opacity: 0, x: 80 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
        exit: { opacity: 0, x: -40, transition: { duration: 0.2, ease: EASE } },
      };
    case "shallower":
      return {
        initial: { opacity: 0, x: -80 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
        exit: { opacity: 0, x: 40, transition: { duration: 0.2, ease: EASE } },
      };
    case "lateral":
    default:
      return {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
        exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: EASE } },
      };
  }
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const reduced = useReducedMotion();
  const direction = useNavigationDirection();

  const variants = reduced ? reducedPageVariants : getVariants(direction);

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        style={{ willChange: "opacity, transform" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
