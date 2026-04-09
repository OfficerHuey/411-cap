import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
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
    ...rest
  },
  ref,
) {
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
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Loader2 size={16} className={styles.spinner} />}
      {iconLeft && !loading && <span className={styles.iconSlot}>{iconLeft}</span>}
      {children && <span className={loading ? styles.loadingContent : undefined}>{children}</span>}
      {iconRight && <span className={styles.iconSlot}>{iconRight}</span>}
    </button>
  );
});
