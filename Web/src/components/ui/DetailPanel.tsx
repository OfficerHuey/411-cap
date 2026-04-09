import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
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

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: {
    x: "100%",
    transition: { duration: 0.2, ease: "easeIn" as const },
  },
} as const;

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
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />
          <motion.div
            className={styles.panel}
            style={{ width }}
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
