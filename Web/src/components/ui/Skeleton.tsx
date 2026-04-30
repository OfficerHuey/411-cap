import styles from "./Skeleton.module.css";

export interface SkeletonProps {
  variant?:
    | "text"
    | "card"
    | "avatar"
    | "button"
    | "custom"
    | "statStrip"
    | "semesterCard"
    | "scheduleCard"
    | "tableRow"
    | "calendarGrid"
    | "heroSection";
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

//composite skeleton renderers — each one matches the exact geometry of the
//content it replaces so data-swap does not shift layout

function StatStripSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1.25rem",
        padding: "2.25rem clamp(1rem, 4vw, 2.5rem)",
      }}
    >
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`${styles.skeleton} ${styles["radius-card"]}`}
          style={{ height: "120px", borderRadius: "22px" }}
        />
      ))}
    </div>
  );
}

function SemesterCardSkeleton() {
  return (
    <div
      className={`${styles.skeleton} ${styles["radius-card"]}`}
      style={{
        height: "180px",
        borderRadius: "22px",
        aspectRatio: "auto",
      }}
    />
  );
}

function ScheduleCardSkeleton() {
  return (
    <div
      className={`${styles.skeleton} ${styles["radius-card"]}`}
      style={{ height: "160px", borderRadius: "22px" }}
    />
  );
}

function TableRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      <div
        className={styles.skeleton}
        style={{ height: "48px", borderRadius: "0" }}
      />
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={styles.skeleton}
          style={{ height: "52px", borderRadius: "0" }}
        />
      ))}
    </div>
  );
}

function HeroSectionSkeleton() {
  return (
    <div
      style={{
        padding: "2.5rem clamp(1rem, 4vw, 3rem) 2rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div
        className={styles.skeleton}
        style={{ width: "48px", height: "20px", borderRadius: "3px" }}
      />
      <div
        className={styles.skeleton}
        style={{ width: "60%", height: "3.5rem", borderRadius: "4px" }}
      />
      <div
        className={styles.skeleton}
        style={{ width: "40%", height: "1rem", borderRadius: "4px" }}
      />
    </div>
  );
}

function CalendarGridSkeleton() {
  return (
    <div
      style={{
        borderRadius: "22px",
        overflow: "hidden",
        border: "1px solid var(--cream-300)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "96px repeat(5, 1fr)",
          height: "52px",
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={styles.skeleton}
            style={{
              height: "52px",
              borderRadius: "0",
              background:
                i === 0
                  ? "var(--green-900)"
                  : "linear-gradient(180deg, var(--green-700) 0%, var(--green-800) 100%)",
            }}
          />
        ))}
      </div>
      <div
        className={styles.skeleton}
        style={{ height: "500px", borderRadius: "0" }}
      />
    </div>
  );
}

export function Skeleton({
  variant = "text",
  width,
  height,
  count = 1,
  className,
}: SkeletonProps) {
  //composite variants — each maps to a layout-matching renderer
  if (variant === "statStrip") return <StatStripSkeleton />;
  if (variant === "semesterCard") return <SemesterCardSkeleton />;
  if (variant === "scheduleCard") return <ScheduleCardSkeleton />;
  if (variant === "tableRow") return <TableRowSkeleton count={count} />;
  if (variant === "calendarGrid") return <CalendarGridSkeleton />;
  if (variant === "heroSection") return <HeroSectionSkeleton />;

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
