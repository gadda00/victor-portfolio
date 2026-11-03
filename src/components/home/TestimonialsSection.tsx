"use client";

import { useLang } from "@/lib/i18n";
import { projects } from "@/lib/projects";
import Reveal from "@/components/fx/Reveal";
import SectionHeader from "@/components/home/SectionHeader";

const quotes = [
  {
    text: "Keja AI set out to make property transactions in Kenya transparent — and the AI layer Victor built is what makes that real in production. The Ask Keja assistant answers from our actual listing data, the investment scores give every property an explainable standard, and the KEJA Trust Score has become the number our users check first — 70 listings were already certified above 80 in the first months.",
    who: "CHACADOM INVESTMENTS",
    role: "Client — Keja AI",
  },
  {
    text: "Tapi Learn needed guidance that never closes and speaks our learners' languages. Victor delivered a 24/7 Career Coach in English, Français and Kiswahili — and the product visibly moved: 11,000+ learners across 38 countries and a 4.8/5 rating. Learners treat the coach as part of the product, not a support widget.",
    who: "ACLA",
    role: "Client — Tapi Learn",
  },
];

export default function TestimonialsSection() {
  const { t } = useLang();
  const keja = projects.find((p) => p.slug === "keja-ai");

  return (
    <section className="container-x mt-28 md:mt-36">
      <SectionHeader
        index="04"
        label={t("voices.label")}
        titleA={t("voices.title.a")}
        titleB={t("voices.title.b")}
      />
      <div className="grid gap-6 md:grid-cols-2">
        {quotes.map((q, i) => (
          <Reveal key={q.who} delay={i * 90}>
            <figure className="flex h-full flex-col border border-line bg-raised/40 p-7 md:p-9">
              <span
                aria-hidden="true"
                className="font-display text-6xl font-extrabold leading-none text-acid"
              >
                &ldquo;
              </span>
              <blockquote className="mt-2 flex-1 text-[15px] leading-relaxed text-ink/90">
                {q.text}
              </blockquote>
              <figcaption className="mt-7 border-t border-line pt-5">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-acid">
                  {q.who}
                </span>
                <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                  {q.role}
                  {keja && i === 0 ? " · keja.app" : i === 1 ? " · acla.io/tapi-learn" : ""}
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
      <Reveal delay={140}>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          Figures quoted by clients; learner and rating numbers are client-reported (Oct 2026).
        </p>
      </Reveal>
    </section>
  );
}
