import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { panelOverlayVariants, panelVariants, reducedFade } from "../../Lib/motion";
import styles from "./DetailPanel.module.css";

interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  width?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function DetailPanel({
  isOpen,
  onClose,
  title,
  icon,
  badge,
  width = 420,
  children,
  footer,
}: DetailPanelProps) {
  const reduced = useReducedMotion();

  //close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.overlay}
            variants={panelOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={reduced ? reducedFade : { duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.panel}
            style={{ width, willChange: "transform" }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                {icon && <span className={styles.headerIcon}>{icon}</span>}
                <h3 className={styles.headerTitle}>{title}</h3>
                {badge}
              </div>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close panel">
                <X size={16} />
              </button>
            </div>

            <div className={styles.body}>
              {children}
            </div>

            {footer && (
              <div className={styles.footer}>
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
