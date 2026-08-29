import { useEffect, useRef, useState } from "react";

/**
 * Fires once when an element first scrolls into view. Used to hold entrance
 * animations and count-ups until the reader actually reaches a section.
 */
export function useInView<T extends HTMLElement>(margin = "-80px") {
  const ref = useRef<T | null>(null);
  // Without IntersectionObserver, show everything rather than nothing.
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: `0px 0px ${margin} 0px` },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [seen, margin]);

  return { ref, seen };
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Eases a number up to `target` once `active` turns true. */
export function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    if (prefersReducedMotion()) {
      const settle = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(settle);
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // easeOutCubic — quick to read, settles gently.
      setValue(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);

  return value;
}
