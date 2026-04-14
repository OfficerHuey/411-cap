import styles from "./Avatar.module.css";

export interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  imageUrl?: string;
}

const sizePx = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 } as const;

//6-color brand palette — greens, golds, sage, bronze
const palette = [
  "var(--green-500)",
  "var(--green-700)",
  "var(--gold-500)",
  "var(--gold-600)",
  "#5b7a3f",
  "#7a6b3f",
];

function hashName(name: string): number {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return sum % palette.length;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = "md", imageUrl }: AvatarProps) {
  const px = sizePx[size];
  const fontSize = px * 0.4;
  const bg = palette[hashName(name)];

  if (imageUrl) {
    return (
      <img
        className={styles.avatar}
        src={imageUrl}
        alt={name}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <span
      className={styles.avatar}
      style={{ width: px, height: px, fontSize, backgroundColor: bg }}
      aria-label={name}
    >
      {getInitials(name)}
    </span>
  );
}
