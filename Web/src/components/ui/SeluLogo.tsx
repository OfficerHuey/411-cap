//southeastern louisiana university shield
//inline svg so the logo scales cleanly and inherits color via currentColor
//when variant="mono" is used on dark surfaces

interface SeluLogoProps {
  size?: number;
  className?: string;
  //framed wraps the shield in a cream disc so it reads as a lapel pin on
  //dark navbar backgrounds. pass false when the logo sits on its own
  framed?: boolean;
  //color variant — full-color shows the green+gold shield,
  //mono strips the green fill so the shield silhouettes in gold only
  //which pops clearly on dark backgrounds without a frame
  variant?: "color" | "mono";
}

function ShieldSvg({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 140"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SELU Logo"
      style={{ display: "block" }}
    >
      {/*shield body — flat top, straight sides, curving to pointed bottom*/}
      <path
        d="M12 12 L108 12 L108 74 Q108 104 60 132 Q12 104 12 74 Z"
        fill="#00563f"
        stroke="#C9A227"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/*inner gold hairline creates a double-outline crest detail*/}
      <path
        d="M20 20 L100 20 L100 72 Q100 98 60 122 Q20 98 20 72 Z"
        fill="none"
        stroke="#C9A227"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.7"
      />
      {/*bold serif S centered in the upper two-thirds of the shield*/}
      <text
        x="60"
        y="82"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="68"
        fontWeight="900"
        fill="#C9A227"
        letterSpacing="-1"
      >
        S
      </text>
      {/*chevron v-mark at the base — a nod to heraldic tradition*/}
      <path
        d="M40 100 L60 114 L80 100"
        fill="none"
        stroke="#C9A227"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldSvgMono({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 140"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SELU Logo"
      style={{ display: "block" }}
    >
      <path
        d="M12 12 L108 12 L108 74 Q108 104 60 132 Q12 104 12 74 Z"
        fill="none"
        stroke="#C9A227"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <text
        x="60"
        y="82"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="68"
        fontWeight="900"
        fill="#C9A227"
        letterSpacing="-1"
      >
        S
      </text>
      <path
        d="M40 100 L60 114 L80 100"
        fill="none"
        stroke="#C9A227"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SeluLogo({ size = 36, className, framed = true, variant = "color" }: SeluLogoProps) {
  const Svg = variant === "mono" ? ShieldSvgMono : ShieldSvg;
  const inner = Math.round(size * 0.82);

  if (!framed) {
    return (
      <span className={className} style={{ display: "inline-flex", flexShrink: 0 }}>
        <Svg size={size} />
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
      <Svg size={inner} />
    </span>
  );
}
