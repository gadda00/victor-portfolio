"use client";

import { useLang } from "@/lib/i18n";
import { capabilities } from "@/lib/projects";
import Reveal from "@/components/fx/Reveal";
import SectionHeader from "@/components/home/SectionHeader";

export default function CapabilitiesSection() {
  const { t } = useLang();

  return (
    <section className="container-x mt-28 md:mt-36">
      <SectionHeader
        index="02"
        label={t("cap.label")}
        titleA={t("cap.title.a")}
        titleB={t("cap.title.b")}
      />
      <div className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2">
        {capabilities.map((cap, i) => (
          <Reveal key={cap.num} delay={i * 70} className="bg-base">
            <article className="group h-full px-6 py-8 transition-colors duration-300 hover:bg-raised md:px-8 md:py-10">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs text-acid">{cap.num}</span>
                <span className="num-outline font-display text-4xl font-extrabold opacity-60 transition-opacity duration-300 group-hover:opacity-100">
                  {cap.num}
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-bold tracking-tight">
                {cap.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-dim">{cap.body}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {cap.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] text-faint"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
