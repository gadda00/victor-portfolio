"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { useLang, type Lang } from "@/lib/i18n";
import { nav, site } from "@/lib/site";

const langs: Lang[] = ["en", "fr", "sw"];

export default function Header() {
  const pathname = usePathname();
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled || open
          ? "border-b border-line bg-base/85 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label="Victor Ndunda — home"
        >
          <span className="grid size-7 place-items-center rounded-[7px] bg-acid font-display text-base font-extrabold text-[#070808] transition-transform duration-300 group-hover:rotate-[8deg]">
            V
          </span>
          <span className="font-mono text-[11px] tracking-[0.22em]">
            VICTOR&nbsp;NDUNDA
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`link-sweep font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  active ? "text-acid" : "text-dim hover:text-ink"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="hidden items-center gap-1 rounded-full border border-line p-1 sm:flex"
            role="group"
            aria-label="Language"
          >
            {langs.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                  lang === l
                    ? "bg-acid text-[#070808]"
                    : "text-faint hover:text-ink"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <span className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 lg:flex">
            <span className="pulse-dot size-1.5 rounded-full bg-acid" aria-hidden="true" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
              Available
            </span>
          </span>

          <button
            type="button"
            className="flex size-9 flex-col items-center justify-center gap-[5px] md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span
              className={`h-px w-5 bg-ink transition-transform duration-300 ${open ? "translate-y-[3px] rotate-45" : ""}`}
            />
            <span
              className={`h-px w-5 bg-ink transition-transform duration-300 ${open ? "-translate-y-[3px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-base/95 backdrop-blur-md md:hidden">
          <nav className="container-x flex flex-col py-6" aria-label="Mobile">
            {nav.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-baseline gap-4 border-b border-line py-4 font-display text-3xl font-bold tracking-tight"
                style={{ "--reveal-delay": `${i * 40}ms` } as CSSProperties}
              >
                <span className="font-mono text-[10px] text-acid">0{i + 1}</span>
                {t(item.key)}
              </Link>
            ))}
            <div className="mt-6 flex items-center gap-2">
              {langs.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
                    lang === l ? "border-acid bg-acid text-[#070808]" : "border-line text-dim"
                  }`}
                >
                  {l}
                </button>
              ))}
              <a
                href={`mailto:${site.email}`}
                className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-dim"
              >
                {site.email}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
