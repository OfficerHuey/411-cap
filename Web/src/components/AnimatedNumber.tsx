import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (n: number) => string;
}

export function AnimatedNumber({ value, duration = 800, formatFn }: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  //start at 0 so first mount animates from 0 to value (count-up effect)
  const [display, setDisplay] = useState(reduced ? value : 0);
  const prevRef = useRef(reduced ? value : 0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }

    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    const startTime = performance.now();
    const diff = to - from;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      //ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + diff * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
        prevRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration, reduced]);

  return <>{formatFn ? formatFn(display) : String(display)}</>;
}
