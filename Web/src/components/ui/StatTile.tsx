import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AnimatedNumber } from "../AnimatedNumber";
import styles from "./StatTile.module.css";

export interface StatTileProps {
  label: string;
  value: string | number;
  trend?: {
    direction: "up" | "down" | "neutral";
    text: string;
  };
  size?: "sm" | "md" | "lg";
  accent?: "green" | "gold" | "none";
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
} as const;

export function StatTile({
  label,
  value,
  trend,
  size = "md",
  accent = "none",
}: StatTileProps) {
  const TrendIcon = trend ? trendIcons[trend.direction] : null;
  const isNumeric = typeof value === "number";

  return (
    <div className={`${styles.tile} ${styles[size]}`}>
      <span className={`${styles.label} ${styles[`accent-${accent}`]}`}>
        {label}
      </span>
      <span className={`${styles.value} ${styles[`value-${size}`]}`}>
        {isNumeric ? <AnimatedNumber value={value} /> : value}
      </span>
      {trend && TrendIcon && (
        <span className={`${styles.trend} ${styles[`trend-${trend.direction}`]}`}>
          <TrendIcon size={14} />
          {trend.text}
        </span>
      )}
    </div>
  );
}
