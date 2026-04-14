import { forwardRef } from "react";
import styles from "./Card.module.css";

type CardVariant = "flat" | "raised" | "elevated" | "hero";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  accentColor?: "green" | "gold" | "none";
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    variant = "raised",
    accentColor,
    interactive = false,
    children,
    className,
    ...rest
  },
  ref,
) {
  //hero variant defaults to gold accent unless explicitly overridden
  const resolvedAccent = accentColor !== undefined
    ? accentColor
    : variant === "hero"
      ? "gold"
      : "none";

  const accentClass =
    resolvedAccent === "gold"
      ? styles.accentGold
      : resolvedAccent === "green"
        ? styles.accentGreen
        : "";

  const classes = [
    styles.card,
    styles[variant],
    accentClass,
    interactive ? styles.interactive : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});
