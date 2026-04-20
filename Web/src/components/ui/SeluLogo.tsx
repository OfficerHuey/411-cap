//southeastern louisiana university shield
//uses the official slu logo image mounted inside a cream disc
//so the white background of the jpg reads as an intentional lapel-pin frame
//on dark surfaces like the nav bar
//to swap in a different asset drop the file at web/public/slu-logo.jpg

interface SeluLogoProps {
  size?: number;
  className?: string;
  framed?: boolean;
}

export function SeluLogo({ size = 36, className, framed = true }: SeluLogoProps) {
  const inner = Math.round(size * 0.86);

  if (!framed) {
    return (
      <img
        src="/slu-logo.jpg"
        width={size}
        height={size}
        alt="Southeastern Louisiana University"
        className={className}
        style={{ display: "block", objectFit: "contain" }}
      />
    );
  }

  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#ffffff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
      aria-label="Southeastern Louisiana University"
      role="img"
    >
      <img
        src="/slu-logo.jpg"
        width={inner}
        height={inner}
        alt=""
        style={{ display: "block", objectFit: "contain" }}
      />
    </span>
  );
}
