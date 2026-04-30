import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { buttonHover, buttonTap, buttonTransition, ease } from "../../Lib/motion";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline" | "link";
type ButtonSize = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    iconLeft,
    iconRight,
    fullWidth = false,
    children,
    className,
    disabled,
    style,
    onAnimationStart: _onAnimationStart,
    onDrag: _onDrag,
    onDragEnd: _onDragEnd,
    onDragStart: _onDragStart,
    ...rest
  },
  ref,
) {
  const reduced = useReducedMotion();
  const isDisabled = disabled || loading;

  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    loading ? styles.loading : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.button
      ref={ref}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      whileHover={!isDisabled && !reduced ? buttonHover : undefined}
      whileTap={!isDisabled && !reduced ? buttonTap : undefined}
      transition={buttonTransition}
      style={style}
      {...rest}
    >
      <AnimatePresence mode="wait">
        {loading && (
          <motion.span
            key="spinner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: ease.ios }}
            style={{ display: "inline-flex" }}
          >
            <Loader2 size={16} className={styles.spinner} />
          </motion.span>
        )}
      </AnimatePresence>
      {iconLeft && !loading && <span className={styles.iconSlot}>{iconLeft}</span>}
      {children && <span className={loading ? styles.loadingContent : undefined}>{children}</span>}
      {iconRight && <span className={styles.iconSlot}>{iconRight}</span>}
    </motion.button>
  );
});
