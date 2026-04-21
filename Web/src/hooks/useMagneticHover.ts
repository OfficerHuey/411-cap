import { useState, useCallback, useRef } from "react";
import { physics } from "../Lib/motion";

interface MagneticConfig {
  /** max pixels the element shifts toward cursor */
  strength?: number;
  /** max scale change on hover */
  scale?: number;
}

//magnetic hover — element follows cursor with spring physics
//apply `magneticProps` to the wrapper and spread `animate`+`transition` on the motion.div
export function useMagneticHover({
  strength = 4,
  scale = 1.01,
}: MagneticConfig = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      //offset from center, normalized to roughly -1..1
      const normalX = (e.clientX - centerX) / (rect.width / 2);
      const normalY = (e.clientY - centerY) / (rect.height / 2);

      setTransform({
        x: normalX * strength,
        y: normalY * strength,
        scale,
      });
    },
    [strength, scale],
  );

  const handleMouseLeave = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  return {
    ref,
    magneticProps: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
    animate: transform,
    transition: physics.magnetic,
  };
}
