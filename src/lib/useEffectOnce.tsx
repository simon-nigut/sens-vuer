import { useEffect, useRef } from "react";

export function useEffectOnce(effect: () => void | (() => void)) {
  const hasRun = useRef(false);
  const effectRef = useRef(effect);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    return effectRef.current();
  }, []);
}