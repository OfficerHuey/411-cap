import styles from "./Badge.module.css";

type BadgeVariant = "green" | "gold" | "red" | "amber" | "neutral" | "inverse";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  children: React.ReactNode;
}

export function Badge({
  variant = "neutral",
  size = "md",
  children,
}: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]}`}>
      {children}
    </span>
  );
}
