import { AnimatedNumber } from "./AnimatedNumber";

interface CapacityMeterProps {
  currentCount: number;
  capacity: number;
}

export function CapacityMeter({ currentCount, capacity }: CapacityMeterProps) {
  if (!capacity || capacity <= 0) {
    return (
      <span style={{
        fontSize: "0.72rem",
        color: "#9ca3af",
        fontFamily: "Inter, sans-serif",
      }}>
        No capacity set
      </span>
    );
  }

  //color logic per nursing dept rules (prompt 2)
  //at capacity or below: green
  //at capacity + 1 (firm cap): amber
  //at capacity + 2+ (hard block): red
  let color: string;
  let bgColor: string;
  let borderColor: string;

  if (currentCount >= capacity + 2) {
    color = "#dc2626";
    bgColor = "rgba(220, 38, 38, 0.08)";
    borderColor = "rgba(220, 38, 38, 0.2)";
  } else if (currentCount >= capacity + 1) {
    color = "#d97706";
    bgColor = "rgba(217, 119, 6, 0.08)";
    borderColor = "rgba(217, 119, 6, 0.2)";
  } else {
    color = "#059669";
    bgColor = "rgba(5, 150, 105, 0.08)";
    borderColor = "rgba(5, 150, 105, 0.2)";
  }

  const pct = Math.min((currentCount / capacity) * 100, 100);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span
        style={{
          fontSize: "0.72rem",
          fontWeight: 500,
          padding: "0.2rem 0.6rem",
          borderRadius: "20px",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          background: bgColor,
          color: color,
          border: `1px solid ${borderColor}`,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <AnimatedNumber value={currentCount} />/{capacity} students
      </span>
      <div
        style={{
          flex: 1,
          maxWidth: "80px",
          height: "4px",
          background: "#f3f4f6",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: "2px",
            width: `${pct}%`,
            background: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
