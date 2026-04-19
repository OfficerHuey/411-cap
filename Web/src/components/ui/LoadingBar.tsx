import { useState, useEffect, useCallback } from "react";
import styles from "./LoadingBar.module.css";

//singleton loading bar state
type Listener = (progress: number) => void;

let progress = 0;
let trickleInterval: ReturnType<typeof setInterval> | null = null;
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach((l) => l(progress));
}

export const loadingBar = {
  start() {
    progress = 0.1;
    notify();
    if (trickleInterval) clearInterval(trickleInterval);
    trickleInterval = setInterval(() => {
      if (progress < 0.9) {
        progress += Math.random() * 0.1;
        notify();
      }
    }, 250);
  },
  finish() {
    if (trickleInterval) clearInterval(trickleInterval);
    trickleInterval = null;
    //ease to 100% then fade out
    progress = 1;
    notify();
    setTimeout(() => {
      progress = 0;
      notify();
    }, 500);
  },
};

export function LoadingBar() {
  const [value, setValue] = useState(0);

  const handleUpdate = useCallback((p: number) => setValue(p), []);

  useEffect(() => {
    listeners.add(handleUpdate);
    return () => { listeners.delete(handleUpdate); };
  }, [handleUpdate]);

  if (value === 0) return null;

  const isComplete = value >= 1;

  return (
    <div
      className={styles.bar}
      style={{
        transform: `translateX(${(value - 1) * 100}%)`,
        transition: isComplete
          ? "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.4s ease 0.1s"
          : "transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
        opacity: isComplete ? 0 : 1,
      }}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
    />
  );
}
