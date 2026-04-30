import { createContext, useContext, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";

type Direction = "deeper" | "shallower" | "lateral";

const NavigationDirectionContext = createContext<Direction>("lateral");

function getDepth(pathname: string): number {
  if (pathname.startsWith("/schedule-builder/")) return 2;
  if (pathname.startsWith("/changelog/")) return 2;
  if (pathname.startsWith("/semester/")) return 1;
  return 0;
}

export function NavigationDirectionProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const prevDepth = useRef(getDepth(location.pathname));

  //compute direction synchronously during render so the new route's first paint uses the right variant
  const currentDepth = getDepth(location.pathname);
  let direction: Direction = "lateral";
  if (currentDepth > prevDepth.current) direction = "deeper";
  else if (currentDepth < prevDepth.current) direction = "shallower";

  useEffect(() => {
    prevDepth.current = currentDepth;
  }, [currentDepth]);

  return (
    <NavigationDirectionContext.Provider value={direction}>
      {children}
    </NavigationDirectionContext.Provider>
  );
}

export function useNavigationDirection(): Direction {
  return useContext(NavigationDirectionContext);
}
