import styles from "./HairlineRule.module.css";

export interface HairlineRuleProps {
  width?: string;
  color?: "gold" | "green" | "muted";
  spacing?: "tight" | "normal" | "loose";
}

export function HairlineRule({
  width = "100%",
  color = "gold",
  spacing = "normal",
}: HairlineRuleProps) {
  return (
    <hr
      className={`${styles.rule} ${styles[color]} ${styles[spacing]}`}
      style={{ width }}
    />
  );
}
