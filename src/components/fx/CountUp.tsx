"use client";

import { useEffect, useRef } from "react";

export default function CountUp({
  to,
  suffix = "",
  locale = false,
  duration = 1600,
  className = "",
}: {
  to: number;
  suffix?: string;
  locale?: boolean;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const render = (n: number) =>
      (locale ? n.toLocaleString("en-US") : String(n)) + suffix;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = render(to);
      return;
    }

    let started = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || started) return;
        started = true;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = render(Math.round(to * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    el.textContent = render(0);
    return () => io.disconnect();
  }, [to, suffix, locale, duration]);

  return (
    <span ref={ref} className={className}>
      {locale ? to.toLocaleString("en-US") : to}
      {suffix}
    </span>
  );
}
