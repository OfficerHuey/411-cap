/**
 * EmptyState — editorial empty state with personality
 *
 * copy guidelines:
 * - title must have personality — not "no data" or "empty"
 *   good: "no active semesters yet", "your archive is empty — locked semesters will appear here"
 * - description should offer a helpful next step, not just describe the emptiness
 *   good: "create your first semester to begin building schedules for the upcoming term"
 */
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const iconSizePx = { sm: 48, md: 64, lg: 80 } as const;

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "md",
}: EmptyStateProps) {
  const circleSize = iconSizePx[size] * 1.6;

  return (
    <div className={`${styles.wrapper} ${styles[size]}`}>
      {icon && (
        <div
          className={styles.iconCircle}
          style={{ width: circleSize, height: circleSize }}
        >
          {icon}
        </div>
      )}
      <h3 className={`${styles.title} ${styles[`title-${size}`]}`}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
