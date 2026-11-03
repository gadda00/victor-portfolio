import Reveal from "@/components/fx/Reveal";

export default function SectionHeader({
  index,
  label,
  titleA,
  titleB,
}: {
  index: string;
  label: string;
  titleA: string;
  titleB: string;
}) {
  return (
    <div className="mb-12 md:mb-16">
      <Reveal>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-acid">{index}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
            {label}
          </span>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
        </div>
      </Reveal>
      <Reveal delay={90}>
        <h2 className="mt-7 font-display text-4xl font-bold leading-[1.02] tracking-tight md:text-6xl">
          {titleA} <span className="text-acid">{titleB}</span>
        </h2>
      </Reveal>
    </div>
  );
}
