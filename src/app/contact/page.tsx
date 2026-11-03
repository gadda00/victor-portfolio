import type { Metadata } from "next";
import { ArrowUpRight, FileText, Github, Linkedin, Mail } from "lucide-react";
import { site } from "@/lib/site";
import Reveal from "@/components/fx/Reveal";
import Magnetic from "@/components/fx/Magnetic";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start a project with Victor Ndunda — AI systems engineer in Nairobi. Client platforms, multi-agent systems, and AI that survives real-world constraints.",
  alternates: { canonical: "/contact" },
};

const engagements = [
  {
    title: "Client AI platforms",
    body: "The Keja AI / Tapi Learn shape: your product's AI layer — assistants, scoring, recommendations, multilingual NLP — built to hold up with real users.",
  },
  {
    title: "Multi-agent systems",
    body: "DAG pipelines, agent orchestration, evals and replay — the Busara AI / AgentReplay discipline applied to your problem.",
  },
  {
    title: "Frontier-constraint engineering",
    body: "Offline-first, low-bandwidth, low-end-device systems for the markets everyone else treats as an edge case.",
  },
];

export default function ContactPage() {
  return (
    <div className="container-x pb-8 pt-28 md:pt-36">
      <Reveal>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
          Contact — {site.location}
        </p>
      </Reveal>
      <Reveal delay={80}>
        <h1 className="mt-6 max-w-4xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-7xl">
          Let&apos;s build something <span className="text-acid">that survives.</span>
        </h1>
      </Reveal>
      <Reveal delay={140}>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-dim">
          One email is enough to start: what you are building, who it serves, and what
          makes it hard. {site.availability}.
        </p>
      </Reveal>

      <Reveal delay={200}>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Magnetic>
            <a
              href={`mailto:${site.email}`}
              className="group inline-flex items-center gap-3 bg-acid px-7 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#070808] transition-colors hover:bg-[#d8ff6e]"
            >
              <Mail className="size-4" />
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
          <a
            href={site.resumePdf}
            aria-label="Résumé PDF"
            className="grid size-[52px] place-items-center border border-line text-dim transition-colors hover:border-acid hover:text-acid"
          >
            <FileText className="size-5" />
          </a>
        </div>
      </Reveal>

      <section className="mt-24">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-acid">01</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
              What I take on
            </span>
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
          </div>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {engagements.map((e, i) => (
            <Reveal key={e.title} delay={i * 70}>
              <article className="h-full border border-line p-7 transition-colors hover:border-acid/30">
                <span className="font-mono text-xs text-acid">0{i + 1}</span>
                <h2 className="mt-4 font-display text-xl font-bold tracking-tight">
                  {e.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-dim">{e.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
