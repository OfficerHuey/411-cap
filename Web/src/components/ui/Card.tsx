import { forwardRef } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { cardHover, cardTap } from "../../Lib/motion";
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
    onAnimationStart: _onAnimationStart,
    onDrag: _onDrag,
    onDragEnd: _onDragEnd,
    onDragStart: _onDragStart,
    ...rest
  },
  ref,
) {
  const reduced = useReducedMotion();

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

  if (interactive && !reduced) {
    return (
      <motion.div
        ref={ref}
        className={classes}
        whileHover={cardHover}
        whileTap={cardTap}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});
