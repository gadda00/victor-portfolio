"use client";

import { ArrowUpRight, Github, Linkedin } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { site } from "@/lib/site";
import Reveal from "@/components/fx/Reveal";
import Magnetic from "@/components/fx/Magnetic";

export default function ContactSection() {
  const { t } = useLang();

  return (
    <section className="container-x mt-28 pb-4 md:mt-40">
      <Reveal>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-acid">05</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
            {t("contact.label")}
          </span>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
        </div>
      </Reveal>

      <Reveal delay={90}>
        <h2 className="mt-10 max-w-5xl font-display text-[clamp(2.4rem,6.5vw,5.2rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
          {t("contact.title.a")}{" "}
          <span className="text-acid">{t("contact.title.b")}</span>
        </h2>
      </Reveal>

      <Reveal delay={160}>
        <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-dim">
          Client platforms, AI systems, or a hard problem with real constraints —
          tell me what needs to survive. {site.availability}.
        </p>
      </Reveal>

      <Reveal delay={220}>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Magnetic>
            <a
              href={`mailto:${site.email}`}
              className="group inline-flex items-center gap-3 bg-acid px-7 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#070808] transition-colors hover:bg-[#d8ff6e]"
            >
              {site.email}
              <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </Magnetic>
          <a
            href={site.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="grid size-[52px] place-items-center border border-line text-dim transition-colors hover:border-acid hover:text-acid"
          >
            <Github className="size-5" />
          </a>
          <a
            href={site.socials.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="grid size-[52px] place-items-center border border-line text-dim transition-colors hover:border-acid hover:text-acid"
          >
            <Linkedin className="size-5" />
          </a>
        </div>
      </Reveal>
    </section>
  );
}
