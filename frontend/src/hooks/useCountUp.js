import { useEffect, useState } from "react";
import useReducedMotion from "./useReducedMotion";

// Compte de 0 à `target` une seule fois (ease-out), immédiat si le mouvement est réduit.
export default function useCountUp(target, { duration = 1100, delay = 250 } = {}) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setValue(target);
      return undefined;
    }
    let raf;
    let start;
    const timer = setTimeout(() => {
      const tick = (now) => {
        start ??= now;
        const t = Math.min((now - start) / duration, 1);
        setValue(target * (1 - Math.pow(1 - t, 4)));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay, reduced]);

  return value;
}
