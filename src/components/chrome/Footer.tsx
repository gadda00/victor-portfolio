"use client";

import Link from "next/link";
import { Github, Linkedin, Mail, FileText } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { site } from "@/lib/site";

const systemLinks = [
  { href: "/work", label: "All systems" },
  { href: "/work/keja-ai", label: "Keja AI" },
  { href: "/work/tapi-learn", label: "Tapi Learn" },
  { href: "/work/firstlight", label: "FirstLight" },
  { href: "/work/agentreplay", label: "AgentReplay" },
];

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="mt-28 border-t border-line">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-7 place-items-center rounded-[7px] bg-acid font-display text-base font-extrabold text-[#070808]">
              V
            </span>
            <span className="font-mono text-[11px] tracking-[0.22em]">VICTOR&nbsp;NDUNDA</span>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-dim">{t("footer.tag")}</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
            Nairobi — 1.2921° S, 36.8219° E
          </p>
        </div>

        <nav aria-label="Systems">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
            {t("footer.col.work")}
          </h2>
          <ul className="mt-4 space-y-2.5">
            {systemLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="link-sweep text-sm text-dim transition-colors hover:text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Elsewhere">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
            {t("footer.col.more")}
          </h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <a
                href={site.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-sm text-dim transition-colors hover:text-ink"
              >
                <Github className="size-3.5 text-faint transition-colors group-hover:text-acid" />
                GitHub — gadda00
              </a>
            </li>
            <li>
              <a
                href={site.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-sm text-dim transition-colors hover:text-ink"
              >
                <Linkedin className="size-3.5 text-faint transition-colors group-hover:text-acid" />
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href={`mailto:${site.email}`}
                className="group inline-flex items-center gap-2 text-sm text-dim transition-colors hover:text-ink"
              >
                <Mail className="size-3.5 text-faint transition-colors group-hover:text-acid" />
                {site.email}
              </a>
            </li>
            <li>
              <a
                href={site.resumePdf}
                className="group inline-flex items-center gap-2 text-sm text-dim transition-colors hover:text-ink"
              >
                <FileText className="size-3.5 text-faint transition-colors group-hover:text-acid" />
                Résumé (PDF)
              </a>
            </li>
            <li>
              <Link
                href="/blog"
                className="link-sweep text-sm text-dim transition-colors hover:text-ink"
              >
                Field Notes
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none select-none overflow-hidden"
      >
        <div className="num-outline translate-y-[16%] text-center font-display text-[21vw] font-extrabold uppercase leading-[0.78] opacity-35">
          NDUNDA
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col items-start justify-between gap-2 py-5 font-mono text-[10px] uppercase tracking-[0.18em] text-faint sm:flex-row sm:items-center">
          <span>{t("footer.rights")}</span>
          <span>EN · FR · SW</span>
        </div>
      </div>
    </footer>
  );
}
