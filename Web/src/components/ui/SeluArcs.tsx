import styles from './SeluArcs.module.css';

interface SeluArcsProps {
  position?: 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right';
  className?: string;
}

export function SeluArcs({ position = 'top-right', className }: SeluArcsProps) {
  return (
    <div
      className={`${styles.arcs} ${styles[position]} ${className || ''}`}
      aria-hidden="true"
    >
      <div className={styles.arc1} />
      <div className={styles.arc2} />
      <div className={styles.arc3} />
      <div className={styles.arc4} />
    </div>
  );
}
