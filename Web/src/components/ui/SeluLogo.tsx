const seluLogoUrl = new URL("../../assets/selu-logo.svg", import.meta.url).href;

interface SeluLogoProps {
  size?: number;
  className?: string;
  framed?: boolean;
  // Kept for compatibility with older call sites. The provided SELU mark is a
  // full-color bitmap-backed SVG, so it cannot be recolored like inline paths.
  variant?: "color" | "mono";
}

function SeluLogoImage({ size }: { size: number }) {
  return (
    <img
      src={seluLogoUrl}
      width={size}
      height={size}
      alt="SELU Logo"
      draggable={false}
      style={{
        display: "block",
        width: size,
        height: size,
        objectFit: "contain",
      }}
    />
  );
}

export function SeluLogo({ size = 36, className, framed = true }: SeluLogoProps) {
  const inner = Math.round(size * 0.82);

  if (!framed) {
    return (
      <span className={className} style={{ display: "inline-flex", flexShrink: 0 }}>
        <SeluLogoImage size={size} />
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#faf8f3",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.04)",
      }}
    >
      <SeluLogoImage size={inner} />
    </span>
  );
}
