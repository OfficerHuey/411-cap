import styles from "./Skeleton.module.css";

export interface SkeletonProps {
  variant?: "text" | "card" | "avatar" | "button" | "custom";
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

const variantDefaults = {
  text: { width: "100%", height: "1em" },
  card: { width: "100%", height: "200px" },
  avatar: { width: "48px", height: "48px" },
  button: { width: "120px", height: "42px" },
  custom: { width: "100%", height: "100%" },
} as const;

function toStyleVal(v: string | number): string {
  return typeof v === "number" ? `${v}px` : v;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  count = 1,
  className,
}: SkeletonProps) {
  const defaults = variantDefaults[variant];
  const w = width ? toStyleVal(width) : defaults.width;
  const h = height ? toStyleVal(height) : defaults.height;

  const radiusClass = styles[`radius-${variant}`] || "";
  const classes = [styles.skeleton, radiusClass, className || ""]
    .filter(Boolean)
    .join(" ");

  if (variant === "text" && count > 1) {
    return (
      <div className={styles.textStack}>
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className={classes}
            style={{
              width: i === count - 1 ? "75%" : w,
              height: h,
            }}
          />
        ))}
      </div>
    );
  }

  return <div className={classes} style={{ width: w, height: h }} />;
}
