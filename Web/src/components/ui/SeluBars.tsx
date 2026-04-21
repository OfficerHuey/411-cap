import styles from './SeluBars.module.css';

interface SeluBarsProps {
  className?: string;
  compact?: boolean;
}

export function SeluBars({ className, compact }: SeluBarsProps) {
  return (
    <div
      className={`${styles.bars} ${compact ? styles.compact : ''} ${className || ''}`}
      aria-hidden="true"
    >
      <div className={styles.barGold} />
      <div className={styles.barGreen} />
      <div className={styles.barGold2} />
    </div>
  );
}
