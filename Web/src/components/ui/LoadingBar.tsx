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
    progress = 1;
    notify();
    if (trickleInterval) clearInterval(trickleInterval);
    trickleInterval = null;
    setTimeout(() => {
      progress = 0;
      notify();
    }, 300);
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

  return (
    <div
      className={styles.bar}
      style={{ transform: `translateX(${(value - 1) * 100}%)` }}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
    />
  );
}
