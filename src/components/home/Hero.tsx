"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { site } from "@/lib/site";
import AgentField from "@/components/fx/AgentField";
import CountUp from "@/components/fx/CountUp";
import Magnetic from "@/components/fx/Magnetic";

export default function Hero() {
  const { t } = useLang();

  return (
    <section className="relative flex min-h-svh flex-col justify-end overflow-hidden pt-16">
      {/* dotted survey grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(236,238,233,0.07) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      <AgentField />
      {/* readability vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 10%, transparent 40%, rgba(7,8,8,0.6) 100%)",
        }}
      />

      <div className="container-x relative pb-12 pt-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.24em] text-dim">
            <span className="pulse-dot size-1.5 rounded-full bg-acid" aria-hidden="true" />
            {t("hero.kicker")}
          </p>
          <p className="hidden font-mono text-[11px] uppercase tracking-[0.24em] text-faint sm:block">
            1.2921° S — 36.8219° E
          </p>
        </div>

        <h1 className="mt-10 font-display text-[clamp(2.85rem,9vw,7.4rem)] font-extrabold uppercase leading-[0.93] tracking-[-0.02em]">
          <span className="block">{t("hero.l1")}</span>
          <span className="block">
            {t("hero.l2a")}
            <span className="text-acid">{t("hero.l2b")}</span>
          </span>
          <span className="num-outline block">{t("hero.l3")}</span>
        </h1>

        <div className="mt-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-xl text-[15px] leading-relaxed text-dim">{t("hero.sub")}</p>
          <div className="flex flex-wrap items-center gap-4">
            <Magnetic>
              <Link
                href="/work"
                className="group inline-flex items-center gap-3 bg-acid px-7 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#070808] transition-colors hover:bg-[#d8ff6e]"
              >
                {t("hero.cta1")}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Magnetic>
            <Magnetic>
              <a
                href={`mailto:${site.email}`}
                className="group inline-flex items-center gap-3 border border-line px-7 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink transition-colors hover:border-acid hover:text-acid"
              >
                {t("hero.cta2")}
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </Magnetic>
          </div>
        </div>

        <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line md:grid-cols-4">
          <div className="bg-base/80 px-5 py-6 backdrop-blur-sm">
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              {t("hero.stat1")}
            </dt>
            <dd className="mt-2 font-display text-4xl font-bold tracking-tight">
              <CountUp to={13} />
            </dd>
          </div>
          <div className="bg-base/80 px-5 py-6 backdrop-blur-sm">
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              {t("hero.stat2")}
            </dt>
            <dd className="mt-2 font-display text-4xl font-bold tracking-tight">
              <CountUp to={11000} locale suffix="+" />
            </dd>
          </div>
          <div className="bg-base/80 px-5 py-6 backdrop-blur-sm">
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              {t("hero.stat3")}
            </dt>
            <dd className="mt-2 font-display text-4xl font-bold tracking-tight">
              <CountUp to={38} />
            </dd>
          </div>
          <div className="bg-base/80 px-5 py-6 backdrop-blur-sm">
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              {t("hero.stat4")}
            </dt>
            <dd className="mt-2 font-display text-4xl font-bold tracking-tight text-acid">
              EN·FR·SW
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
