import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useReducedMotion } from "../../hooks/useReducedMotion";

//page transitions — opacity + tiny translateY only
//rationale: scale/translateX/rotate on this wrapper would create a CSS containing
//block that breaks position:fixed descendants. all our fixed surfaces (Modal,
//Toast, Tooltip, CommandPalette, DetailPanel, Select dropdowns) portal to
//document.body, so they escape this wrapper regardless. opacity + small
//translateY is safe so long as nothing inside relies on this element NOT being
//a containing block
const variants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1],
    },
  },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const location = useLocation();

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      key={location.pathname}
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
      style={{ width: "100%" }}
    >
      {children}
    </motion.div>
  );
}
