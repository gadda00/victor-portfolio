import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { site } from "@/lib/site";
import Reveal from "@/components/fx/Reveal";
import CountUp from "@/components/fx/CountUp";

export const metadata: Metadata = {
  title: "About",
  description:
    "AI systems engineer in Nairobi — 5+ years shipping Go, TypeScript, Python and Flutter systems on a data-science foundation built inside Kenyan financial institutions.",
  alternates: { canonical: "/about" },
};

const timeline = [
  {
    period: "Foundation",
    title: "Data science inside Kenyan finance",
    body: "The statistical ground floor: data-science work inside Kenyan financial institutions — RBA, NSSF and Enwealth — where a wrong number is a regulatory event, not a dashboard inconvenience.",
  },
  {
    period: "2025",
    title: "Agritech at scale",
    body: "KilimoPRO — offline-first agricultural AI for 8 IGAD countries: on-device TensorFlow Lite detection, a 5-persona Multi-LLM Council, 22 verified data sources, SMS delivery.",
  },
  {
    period: "2026",
    title: "Client platforms in production",
    body: "The AI layer of Keja AI for CHACADOM INVESTMENTS (public trial, 12 counties) and Tapi Learn for ACLA (11,000+ learners, 38 countries) — plus Busara AI, AgentReplay, Verxlite and the fraud-detection system.",
  },
  {
    period: "Now",
    title: "Nairobi → worldwide",
    body: "Available for select engagements, remote worldwide. Currently building Hazina Assist (details at first milestone) and writing about what production AI actually takes.",
  },
];

const principles = [
  {
    num: "01",
    title: "Outcomes over demos",
    body: "A system that works for 87 live listings beats a demo that works for a screenshot. Every project page on this site leads with what the system does in the world.",
  },
  {
    num: "02",
    title: "Constraints first",
    body: "Low bandwidth, low-end devices, three languages, intermittent power — designing for the hardest real conditions produces systems that survive everywhere.",
  },
  {
    num: "03",
    title: "Own the whole system",
    body: "Statistics implemented from scratch, replay layers built not bought, the full path from data to decision — ownership is how reliability becomes possible.",
  },
  {
    num: "04",
    title: "Honest numbers",
    body: "Client-reported metrics are labeled client-reported. Simulated data is labeled simulated. Trust compounds; inflated claims don't.",
  },
];

const stackBands = [
  { label: "Core", items: ["TypeScript", "Python", "Go 1.22", "SQL"] },
  { label: "AI", items: ["LangGraph", "RAG", "GLM-4.6", "OpenAI SDK", "Anthropic SDK", "TensorFlow Lite"] },
  { label: "Platforms", items: ["Next.js 14–16", "FastAPI", "Gin", "PostgreSQL", "Drizzle", "Celery", "Turborepo"] },
  { label: "Operations", items: ["Kubernetes", "Prometheus", "OpenTelemetry", "Langfuse", "GitHub Actions"] },
];

export default function AboutPage() {
  return (
    <div className="container-x pb-8 pt-28 md:pt-36">
      <Reveal>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
          About — Nairobi, Kenya
        </p>
      </Reveal>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_280px]">
        <div>
          <Reveal delay={60}>
            <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.98] tracking-tight md:text-6xl">
              Systems that <span className="text-acid">survive</span> the real world.
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 max-w-3xl space-y-5 text-[15px] leading-relaxed text-dim">
              <p>
                I&apos;m Victor Ndunda, an AI systems engineer in Nairobi. I design and
                ship production AI — multi-agent platforms, RAG systems and applied
                machine learning — for African and global markets, with a bias for
                systems that survive real-world constraints: low bandwidth, low-end
                devices and multilingual users.
              </p>
              <p>
                Recent client work: the AI layer of{" "}
                <Link href="/work/tapi-learn" className="link-sweep text-ink">
                  Tapi Learn
                </Link>{" "}
                for ACLA, serving 11,000+ learners across 38 countries (EN·FR·SW,
                4.8/5 client-reported), and{" "}
                <Link href="/work/keja-ai" className="link-sweep text-ink">
                  Keja AI
                </Link>{" "}
                for CHACADOM INVESTMENTS — a 7-stage real-estate platform in public
                trial across 12 Kenyan counties.
              </p>
              <p>
                Creator of{" "}
                <Link href="/work/busara-ai" className="link-sweep text-ink">
                  Busara AI
                </Link>{" "}
                (6-stage multi-agent DAG pipeline with statistics implemented from
                scratch),{" "}
                <Link href="/work/kilimopro" className="link-sweep text-ink">
                  KilimoPRO
                </Link>{" "}
                (offline-first agri-AI for 8 IGAD countries, on-device TensorFlow Lite
                detection) and{" "}
                <Link href="/work/agentreplay" className="link-sweep text-ink">
                  AgentReplay
                </Link>{" "}
                (deterministic replay for AI agents: 0.67% overhead, 100% reproduction
                fidelity, MIT-licensed).
              </p>
              <p>
                5+ years shipping Go, TypeScript, Python and Flutter systems, on a
                data-science foundation built inside Kenyan financial institutions
                (RBA, NSSF, Enwealth). Based in Nairobi — available for remote
                engagements worldwide.
              </p>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <dl className="mt-10 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
              <div className="bg-base px-4 py-5">
                <dd className="font-display text-3xl font-bold">
                  <CountUp to={13} />
                </dd>
                <dt className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  systems shipped
                </dt>
              </div>
              <div className="bg-base px-4 py-5">
                <dd className="font-display text-3xl font-bold">
                  <CountUp to={5} suffix="+" />
                </dd>
                <dt className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  years shipping
                </dt>
              </div>
              <div className="bg-base px-4 py-5">
                <dd className="font-display text-3xl font-bold">
                  <CountUp to={50} suffix="+" />
                </dd>
                <dt className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  agents orchestrated
                </dt>
              </div>
              <div className="bg-base px-4 py-5">
                <dd className="font-display text-3xl font-bold text-acid">3</dd>
                <dt className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  working languages
                </dt>
              </div>
            </dl>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <div className="lg:sticky lg:top-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/profile-pic-800.png"
              alt="Victor Ndunda — AI Systems Engineer, Nairobi"
              className="w-full rounded-2xl border border-line object-cover grayscale transition-all duration-700 hover:grayscale-0"
            />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              Nairobi — 1.2921° S, 36.8219° E
            </p>
            <a
              href={site.resumePdf}
              className="mt-5 inline-flex items-center gap-3 border border-line px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:border-acid hover:text-acid"
            >
              <FileText className="size-4" /> Résumé (PDF)
            </a>
          </div>
        </Reveal>
      </div>

      {/* Timeline */}
      <section className="mt-24">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-acid">01</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
              Trajectory
            </span>
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
          </div>
        </Reveal>
        <div className="mt-10 grid gap-px border border-line bg-line md:grid-cols-2 xl:grid-cols-4">
          {timeline.map((t, i) => (
            <Reveal key={t.period} delay={i * 70} className="bg-base">
              <article className="h-full p-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-acid">
                  {t.period}
                </span>
                <h3 className="mt-4 font-display text-xl font-bold tracking-tight">
                  {t.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-dim">{t.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="mt-24">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-acid">02</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
              Operating principles
            </span>
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
          </div>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {principles.map((p, i) => (
            <Reveal key={p.num} delay={i * 60}>
              <article className="border border-line p-7 transition-colors hover:border-acid/30">
                <span className="num-outline font-display text-4xl font-extrabold">
                  {p.num}
                </span>
                <h3 className="mt-4 font-display text-xl font-bold tracking-tight">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-dim">{p.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section className="mt-24">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-acid">03</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
              Working stack
            </span>
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
          </div>
        </Reveal>
        <div className="mt-10 space-y-6">
          {stackBands.map((band, i) => (
            <Reveal key={band.label} delay={i * 50}>
              <div className="grid gap-3 border-t border-line pt-5 md:grid-cols-[140px_1fr]">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                  {band.label}
                </span>
                <div className="flex flex-wrap gap-2">
                  {band.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-line px-3 py-1.5 font-mono text-[11px] text-dim transition-colors hover:border-acid/40 hover:text-ink"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
