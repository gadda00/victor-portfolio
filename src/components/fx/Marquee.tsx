import type { CSSProperties } from "react";

export default function Marquee({
  items,
  speed = 46,
  className = "",
}: {
  items: string[];
  speed?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden border-y border-line py-4 ${className}`}
      aria-hidden="true"
    >
      <div
        className="marquee-track"
        style={{ "--marquee-speed": `${speed}s` } as CSSProperties}
      >
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center">
            {items.map((item, i) => (
              <span
                key={`${half}-${i}`}
                className="flex items-center font-mono text-[11px] uppercase tracking-[0.3em] text-dim"
              >
                <span className="px-7">{item}</span>
                <span className="text-acid">·</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
