import styles from "./Badge.module.css";

type BadgeVariant = "green" | "gold" | "red" | "amber" | "neutral" | "inverse";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}

export function Badge({
  variant = "neutral",
  size = "md",
  className,
  children,
}: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className || ""}`}>
      {children}
    </span>
  );
}
