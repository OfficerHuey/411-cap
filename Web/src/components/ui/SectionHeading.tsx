import { NumberBadge } from "./NumberBadge";
import { HairlineRule } from "./HairlineRule";
import styles from "./SectionHeading.module.css";

export interface SectionHeadingProps {
  number?: string | number;
  title: string;
  italicWord?: string;
  subtitle?: string;
  level?: "page" | "section" | "subsection";
  action?: React.ReactNode;
}

//renders title with optional italic accent word
function renderTitle(title: string, italicWord?: string) {
  if (!italicWord) return title;
  const idx = title.indexOf(italicWord);
  if (idx === -1) return title;
  return (
    <>
      {title.slice(0, idx)}
      <em className={styles.italic}>{italicWord}</em>
      {title.slice(idx + italicWord.length)}
    </>
  );
}

const levelConfig = {
  page: {
    badgeVariant: "gold" as const,
    badgeSize: "lg" as const,
    ruleColor: "gold" as const,
    ruleSpacing: "loose" as const,
  },
  section: {
    badgeVariant: "default" as const,
    badgeSize: "md" as const,
    ruleColor: "gold" as const,
    ruleSpacing: "normal" as const,
  },
  subsection: {
    badgeVariant: "default" as const,
    badgeSize: "sm" as const,
    ruleColor: "muted" as const,
    ruleSpacing: "tight" as const,
  },
} as const;

export function SectionHeading({
  number,
  title,
  italicWord,
  subtitle,
  level = "section",
  action,
}: SectionHeadingProps) {
  const config = levelConfig[level];
  const Tag = level === "page" ? "h1" : level === "section" ? "h2" : "h3";

  return (
    <div className={styles.wrapper}>
      <div className={styles.top}>
        <div className={styles.text}>
          {number != null && level !== "subsection" && (
            <NumberBadge
              number={number}
              variant={config.badgeVariant}
              size={config.badgeSize}
            />
          )}
          <Tag className={`${styles.title} ${styles[level]}`}>
            {renderTitle(title, italicWord)}
          </Tag>
          {subtitle && (
            <p className={`${styles.subtitle} ${styles[`sub-${level}`]}`}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </div>
      <HairlineRule color={config.ruleColor} spacing={config.ruleSpacing} />
    </div>
  );
}
