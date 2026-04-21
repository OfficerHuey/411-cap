import styles from './StripeAccent.module.css';

interface StripeAccentProps {
  className?: string;
  variant?: 'full' | 'contained';
  height?: number;
}

export function StripeAccent({
  className,
  variant = 'contained',
  height = 6,
}: StripeAccentProps) {
  return (
    <div
      className={`${styles.stripe} ${styles[variant]} ${className || ''}`}
      style={{ height }}
      aria-hidden="true"
    />
  );
}
