"use client";

import { useEffect, useRef } from "react";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.body.classList.add("vn-cursor");
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let hover = false;
    let visible = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      visible = true;
      const target = e.target as HTMLElement | null;
      hover = !!target?.closest("a,button,[role='button'],input,textarea,select,label");
    };
    const onLeave = () => {
      visible = false;
    };

    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      const dot = dotRef.current;
      const ring = ringRef.current;
      if (dot) {
        dot.style.transform = `translate(${x - 3}px, ${y - 3}px)`;
        dot.style.opacity = visible ? "1" : "0";
      }
      if (ring) {
        ring.style.transform = `translate(${rx - 18}px, ${ry - 18}px) scale(${hover ? 1.6 : 1})`;
        ring.style.opacity = visible ? (hover ? "0.9" : "0.55") : "0";
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove("vn-cursor");
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[90] size-1.5 rounded-full bg-acid opacity-0"
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[90] size-9 rounded-full border border-acid opacity-0"
      />
    </>
  );
}
