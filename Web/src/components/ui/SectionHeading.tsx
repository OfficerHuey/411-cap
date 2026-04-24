import { HairlineRule } from "./HairlineRule";
import styles from "./SectionHeading.module.css";

export interface SectionHeadingProps {
  //number kept in the prop signature for backwards compatibility with
  //existing call sites, but no longer rendered — the "N° XX" marker was
  //removed app-wide per brand direction
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
    ruleColor: "gold" as const,
    ruleSpacing: "loose" as const,
  },
  section: {
    ruleColor: "gold" as const,
    ruleSpacing: "normal" as const,
  },
  subsection: {
    ruleColor: "muted" as const,
    ruleSpacing: "tight" as const,
  },
} as const;

export function SectionHeading({
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
