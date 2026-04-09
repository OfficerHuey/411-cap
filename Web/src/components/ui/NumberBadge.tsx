import styles from "./NumberBadge.module.css";

type NumberBadgeVariant = "default" | "light" | "gold";
type NumberBadgeSize = "sm" | "md" | "lg";

export interface NumberBadgeProps {
  number: string | number;
  variant?: NumberBadgeVariant;
  size?: NumberBadgeSize;
}

export function NumberBadge({
  number,
  variant = "default",
  size = "md",
}: NumberBadgeProps) {
  //auto-pad numeric values to 2 digits
  const formatted =
    typeof number === "number"
      ? String(number).padStart(2, "0")
      : number;

  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]}`}>
      N&#186; {formatted}
    </span>
  );
}
