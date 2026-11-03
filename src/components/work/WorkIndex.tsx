"use client";

import Link from "next/link";
import { ArrowUpRight, Github, Globe } from "lucide-react";
import { useState } from "react";
import { projectCategories, projects } from "@/lib/projects";
import Reveal from "@/components/fx/Reveal";
import { StatusChip } from "@/components/work/SystemRow";

export default function WorkIndex() {
  const [filter, setFilter] = useState("All");
  const visible =
    filter === "All" ? projects : projects.filter((p) => p.category === filter);

  return (
    <div className="container-x pb-8 pt-28 md:pt-36">
      <Reveal>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
          Work — 13 systems
        </p>
      </Reveal>
      <Reveal delay={80}>
        <h1 className="mt-6 font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-7xl">
          Everything <span className="text-acid">shipped.</span>
        </h1>
      </Reveal>
      <Reveal delay={140}>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-dim">
          Client platforms in public trial, owned products in production, open-source
          tools in the wild — and one thing still in stealth. Outcome first, always.
        </p>
      </Reveal>

      <Reveal delay={200}>
        <div
          className="mt-10 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter systems by category"
        >
          {projectCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={filter === cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                filter === cat
                  ? "border-acid bg-acid text-[#070808]"
                  : "border-line text-dim hover:border-acid/40 hover:text-ink"
              }`}
            >
              {cat}
              <span className="ml-2 opacity-60">
                {cat === "All"
                  ? projects.length
                  : projects.filter((p) => p.category === cat).length}
              </span>
            </button>
          ))}
        </div>
      </Reveal>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {visible.map((p, i) => (
          <Reveal key={p.slug} delay={Math.min(i, 4) * 60}>
            <article
              className={`group relative flex h-full flex-col border p-6 transition-colors duration-300 md:p-8 ${
                p.status === "stealth"
                  ? "border-line bg-raised/30"
                  : "border-line bg-raised/40 hover:border-acid/30 hover:bg-raised/70"
              }`}
            >
              {p.status === "stealth" ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.35]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(-45deg, transparent 0 14px, rgba(236,238,233,0.03) 14px 15px)",
                  }}
                />
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <StatusChip project={p} />
              </div>

              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight">
                {p.name}
              </h2>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                {p.client ? `${p.client} · ` : ""}
                {p.domain} · {p.year}
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-dim">{p.summary}</p>

              {p.metrics.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {p.metrics.slice(0, 3).map((m) => (
                    <span
                      key={m.label}
                      className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] text-faint"
                    >
                      <span className="text-ink">{m.value}</span> {m.label}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5">
                <Link
                  href={`/work/${p.slug}`}
                  className="link-sweep font-mono text-[11px] uppercase tracking-[0.18em] text-ink transition-colors hover:text-acid"
                >
                  {p.caseStudy ? "Case study" : "Details"}
                </Link>
                {p.liveUrl ? (
                  <a
                    href={p.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-dim transition-colors hover:text-acid"
                  >
                    <Globe className="size-3.5" /> Live
                  </a>
                ) : null}
                {p.demoUrl ? (
                  <a
                    href={p.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-dim transition-colors hover:text-acid"
                  >
                    <ArrowUpRight className="size-3.5" /> Demo
                  </a>
                ) : null}
                {p.github ? (
                  <a
                    href={p.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-dim transition-colors hover:text-acid"
                  >
                    <Github className="size-3.5" /> Source
                  </a>
                ) : null}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
