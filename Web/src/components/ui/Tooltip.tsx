import { useState, useRef, useCallback, useId, cloneElement, isValidElement } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Tooltip.module.css";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: "top" | "right" | "bottom" | "left";
  delay?: number;
}

const offsets: Record<string, { x: number; y: number }> = {
  top: { x: 0, y: -4 },
  bottom: { x: 0, y: 4 },
  left: { x: -4, y: 0 },
  right: { x: 4, y: 0 },
};

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 300,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipId = useId();

  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;
    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = rect.top - gap;
        left = rect.left + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - gap;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
        break;
    }
    setCoords({ top, left });
  }, [position]);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => {
      calcPosition();
      setVisible(true);
    }, delay);
  }, [delay, calcPosition]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  const offset = offsets[position];

  //determine transform-origin anchor
  const anchorMap: Record<string, string> = {
    top: "bottom center",
    bottom: "top center",
    left: "center right",
    right: "center left",
  };

  //ensure child is a valid element; wrap plain text in span
  const child = isValidElement(children) ? children : <span>{children}</span>;

  return (
    <>
      {cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        ref: triggerRef,
        onMouseEnter: show,
        onMouseLeave: hide,
        onFocus: show,
        onBlur: hide,
        "aria-describedby": visible ? tooltipId : undefined,
      })}
      {createPortal(
        <AnimatePresence>
          {visible && (
            <motion.div
              id={tooltipId}
              role="tooltip"
              className={`${styles.tooltip} ${styles[position]}`}
              style={{
                top: coords.top,
                left: coords.left,
                transformOrigin: anchorMap[position],
              }}
              initial={{ opacity: 0, scale: 0.95, x: offset.x * -1, y: offset.y * -1 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: offset.x * -1, y: offset.y * -1 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
