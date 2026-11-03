import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/projects";

const statusStyles: Record<Project["status"], string> = {
  live: "border-acid/40 text-acid",
  trial: "border-amber/40 text-amber",
  production: "border-acid/40 text-acid",
  active: "border-acid/40 text-acid",
  shipped: "border-line text-dim",
  dev: "border-line text-dim",
  stealth: "border-line text-faint",
};

export function StatusChip({ project }: { project: Project }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] ${statusStyles[project.status]}`}
    >
      {project.status === "live" || project.status === "production" || project.status === "active" ? (
        <span className="pulse-dot size-1 rounded-full bg-acid" aria-hidden="true" />
      ) : null}
      {project.statusLabel}
    </span>
  );
}

export default function SystemRow({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  return (
    <Link
      href={`/work/${project.slug}`}
      className="group relative grid gap-3 border-t border-line py-7 transition-colors duration-300 last:border-b hover:bg-raised/60 md:grid-cols-[56px_1fr_auto] md:items-center md:gap-6 md:py-9"
    >
      <span className="font-mono text-xs text-faint transition-colors group-hover:text-acid">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h3 className="font-display text-2xl font-bold tracking-tight transition-transform duration-300 group-hover:translate-x-1 md:text-4xl">
            {project.name}
          </h3>
          <StatusChip project={project} />
          {project.client ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              {project.client}
            </span>
          ) : null}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dim">{project.tagline}</p>
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {project.metrics.slice(0, 3).map((m) => (
            <span
              key={m.label}
              className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] text-faint transition-colors group-hover:border-acid/30 group-hover:text-dim"
            >
              <span className="text-ink">{m.value}</span> {m.label}
            </span>
          ))}
        </div>
      </div>

      <ArrowUpRight
        className="hidden size-6 text-faint transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-acid md:block"
        aria-hidden="true"
      />
    </Link>
  );
}
