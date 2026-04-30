import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

//wraps framer's hook with a safe default
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}

//static check for non-component contexts (e.g. module-level constants)
export const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
