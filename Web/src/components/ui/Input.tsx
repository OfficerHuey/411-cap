import { forwardRef, useId } from "react";
import styles from "./Input.module.css";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  successText?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    errorText,
    successText,
    iconLeft,
    iconRight,
    fullWidth = false,
    className,
    id: externalId,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = externalId || autoId;
  const helperId = `${inputId}-helper`;

  const bottomText = errorText || successText || helperText;
  const bottomClass = errorText
    ? styles.helperError
    : successText
      ? styles.helperSuccess
      : "";

  const fieldClasses = [
    styles.field,
    iconLeft ? styles.hasIconLeft : "",
    iconRight ? styles.hasIconRight : "",
    errorText ? styles.fieldError : "",
    successText ? styles.fieldSuccess : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ""}`}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}

      <div className={styles.fieldWrapper}>
        {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}

        <input
          ref={ref}
          id={inputId}
          className={fieldClasses}
          aria-describedby={bottomText ? helperId : undefined}
          aria-invalid={!!errorText || undefined}
          {...rest}
        />

        {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
      </div>

      {bottomText && (
        <span id={helperId} className={`${styles.helperText} ${bottomClass}`}>
          {bottomText}
        </span>
      )}
    </div>
  );
});