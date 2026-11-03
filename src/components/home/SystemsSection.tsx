"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { featuredProjects } from "@/lib/projects";
import Reveal from "@/components/fx/Reveal";
import SectionHeader from "@/components/home/SectionHeader";
import SystemRow from "@/components/work/SystemRow";

export default function SystemsSection() {
  const { t } = useLang();

  return (
    <section className="container-x mt-28 md:mt-36" aria-labelledby="systems-h">
      <SectionHeader
        index="01"
        label={t("work.label")}
        titleA={t("work.title.a")}
        titleB={t("work.title.b")}
      />
      <div id="systems-h" className="sr-only">
        Selected systems
      </div>
      <Reveal>
        <div>
          {featuredProjects.map((p, i) => (
            <SystemRow key={p.slug} project={p} index={i} />
          ))}
        </div>
      </Reveal>
      <Reveal delay={120}>
        <div className="mt-8 flex justify-end">
          <Link
            href="/work"
            className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dim transition-colors hover:text-acid"
          >
            All 13 systems — including what is in stealth
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
