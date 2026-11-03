import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Github, Globe } from "lucide-react";
import { getProject, projects } from "@/lib/projects";
import Reveal from "@/components/fx/Reveal";
import { StatusChip } from "@/components/work/SystemRow";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: `${project.name} — ${project.tagline}`,
    description: project.summary,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      title: `${project.name} — Victor Ndunda`,
      description: project.tagline,
      url: `/work/${project.slug}`,
    },
  };
}

function BodyLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-acid">
      {children}
    </span>
  );
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const idx = projects.findIndex((p) => p.slug === slug);
  const next = projects[(idx + 1) % projects.length];
  const cs = project.caseStudy;

  return (
    <article className="pt-24 md:pt-32">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="container-x">
        <Reveal>
          <Link
            href="/work"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-dim transition-colors hover:text-acid"
          >
            <ArrowLeft className="size-3.5" /> All systems
          </Link>
        </Reveal>

        <Reveal delay={60}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <StatusChip project={project} />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              {project.client ? `${project.client} · ` : ""}
              {project.domain} · {project.year}
            </span>
          </div>
        </Reveal>

        <Reveal delay={110}>
          <h1
            className="mt-6 font-display text-[clamp(3rem,10vw,8rem)] font-extrabold uppercase leading-[0.92] tracking-tight"
            style={{ color: project.status === "stealth" ? undefined : undefined }}
          >
            {project.name}
          </h1>
        </Reveal>

        <Reveal delay={170}>
          <p className="mt-6 max-w-3xl font-display text-xl font-medium leading-snug text-dim md:text-2xl">
            {project.tagline}
          </p>
        </Reveal>

        {project.status !== "stealth" ? (
          <Reveal delay={220}>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 bg-acid px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#070808] transition-colors hover:bg-[#d8ff6e]"
                >
                  <Globe className="size-4" /> Visit platform
                  <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              ) : null}
              {project.demoUrl ? (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 border border-line px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:border-acid hover:text-acid"
                >
                  <ArrowUpRight className="size-4" /> Open demo
                </a>
              ) : null}
              {project.github ? (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 border border-line px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:border-acid hover:text-acid"
                >
                  <Github className="size-4" /> Source
                </a>
              ) : null}
            </div>
          </Reveal>
        ) : null}
      </div>

      {/* ── Metrics band ───────────────────────────────────────── */}
      {project.metrics.length > 0 ? (
        <div className="container-x mt-14">
          <Reveal>
            <dl className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
              {project.metrics.map((m) => (
                <div key={m.label} className="bg-base px-5 py-6">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                    {m.label}
                  </dt>
                  <dd className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
                    {m.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      ) : null}

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="container-x mt-20 grid gap-14 lg:grid-cols-[230px_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Reveal>
            <div className="space-y-7 border border-line p-6">
              <div>
                <h2 className="font-mono text-[9px] uppercase tracking-[0.24em] text-faint">
                  Client
                </h2>
                <p className="mt-2 text-sm">{project.client ?? "Owned / open-source"}</p>
              </div>
              <div>
                <h2 className="font-mono text-[9px] uppercase tracking-[0.24em] text-faint">
                  Domain
                </h2>
                <p className="mt-2 text-sm">{project.domain}</p>
              </div>
              <div>
                <h2 className="font-mono text-[9px] uppercase tracking-[0.24em] text-faint">
                  Year
                </h2>
                <p className="mt-2 text-sm">{project.year}</p>
              </div>
              <div>
                <h2 className="font-mono text-[9px] uppercase tracking-[0.24em] text-faint">
                  Status
                </h2>
                <p className="mt-2 text-sm">{project.statusLabel}</p>
              </div>
              {project.stack.length > 0 ? (
                <div>
                  <h2 className="font-mono text-[9px] uppercase tracking-[0.24em] text-faint">
                    Stack
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.stack.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-dim"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Reveal>
        </aside>

        <div className="max-w-3xl">
          {cs ? (
            <>
              <Reveal>
                <section>
                  <BodyLabel>The mandate</BodyLabel>
                  <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
                    Why this system exists.
                  </h2>
                  <div className="mt-6 space-y-5">
                    {cs.mandate.map((para, i) => (
                      <p key={i} className="text-[15px] leading-relaxed text-dim">
                        {para}
                      </p>
                    ))}
                  </div>
                </section>
              </Reveal>

              <Reveal>
                <section className="mt-16">
                  <BodyLabel>What I built</BodyLabel>
                  <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
                    The system, piece by piece.
                  </h2>
                  <ul className="mt-7 space-y-4">
                    {cs.built.map((item, i) => (
                      <li key={i} className="flex gap-4 text-[15px] leading-relaxed text-dim">
                        <span
                          className="mt-[9px] size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: project.accent }}
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>

              {cs.flow ? (
                <Reveal>
                  <section className="mt-16">
                    <BodyLabel>{cs.flow.title}</BodyLabel>
                    <div className="mt-6 flex flex-wrap items-center gap-2.5">
                      {cs.flow.items.map((stage, i) => (
                        <span key={stage} className="flex items-center gap-2.5">
                          <span
                            className="rounded-lg border px-3.5 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink"
                            style={{ borderColor: `${project.accent}44` }}
                          >
                            {stage}
                          </span>
                          {i < cs.flow!.items.length - 1 ? (
                            <ArrowRight
                              className="size-3.5 text-faint"
                              aria-hidden="true"
                            />
                          ) : null}
                        </span>
                      ))}
                    </div>
                  </section>
                </Reveal>
              ) : null}

              <Reveal>
                <section className="mt-16">
                  <BodyLabel>Outcomes</BodyLabel>
                  <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
                    What it does in the world.
                  </h2>
                  <dl className="mt-7 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
                    {cs.outcomes.map((o) => (
                      <div key={o.label} className="bg-base px-4 py-5">
                        <dd
                          className="font-display text-2xl font-bold tracking-tight md:text-3xl"
                          style={{ color: project.accent }}
                        >
                          {o.value}
                        </dd>
                        <dt className="mt-1.5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-faint">
                          {o.label}
                        </dt>
                      </div>
                    ))}
                  </dl>
                  {cs.outcomeNote ? (
                    <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-faint">
                      {cs.outcomeNote}
                    </p>
                  ) : null}
                </section>
              </Reveal>

              {cs.quote ? (
                <Reveal>
                  <figure className="mt-16 border-l-2 border-acid pl-6 md:pl-8">
                    <blockquote className="font-display text-xl font-medium leading-relaxed text-ink md:text-2xl">
                      &ldquo;{cs.quote.text}&rdquo;
                    </blockquote>
                    <figcaption className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-acid">
                      {cs.quote.who}
                      <span className="ml-2 text-faint">· {cs.quote.org}</span>
                    </figcaption>
                  </figure>
                </Reveal>
              ) : null}
            </>
          ) : (
            <Reveal>
              <section>
                <BodyLabel>Overview</BodyLabel>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
                  What this system is.
                </h2>
                <p className="mt-6 text-[15px] leading-relaxed text-dim">{project.summary}</p>
                {project.github || project.liveUrl || project.demoUrl ? (
                  <p className="mt-6 text-[15px] leading-relaxed text-dim">
                    Explore it directly — links are on the left rail and at the top of
                    this page.
                  </p>
                ) : null}
              </section>
            </Reveal>
          )}
        </div>
      </div>

      {/* ── Next system ────────────────────────────────────────── */}
      <div className="mt-24 border-t border-line">
        <Link
          href={`/work/${next.slug}`}
          className="group container-x flex flex-wrap items-center justify-between gap-6 py-12 md:py-16"
        >
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
              Next system
            </span>
            <h3 className="mt-3 font-display text-4xl font-extrabold uppercase tracking-tight transition-transform duration-300 group-hover:translate-x-2 md:text-6xl">
              {next.name}
            </h3>
            <p className="mt-2 max-w-xl text-sm text-dim">{next.tagline}</p>
          </div>
          <ArrowRight
            className="size-8 text-faint transition-all duration-300 group-hover:translate-x-2 group-hover:text-acid"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  );
}
