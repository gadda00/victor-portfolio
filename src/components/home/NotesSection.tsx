"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { posts, formatDate } from "@/lib/posts";
import Reveal from "@/components/fx/Reveal";
import SectionHeader from "@/components/home/SectionHeader";

const tagColor: Record<string, string> = {
  ai: "text-acid border-acid/30",
  engineering: "text-amber border-amber/30",
  research: "text-sky-300 border-sky-300/30",
  agri: "text-emerald-300 border-emerald-300/30",
};

export default function NotesSection() {
  const { t } = useLang();
  const latest = posts.slice(0, 3);

  return (
    <section className="container-x mt-28 md:mt-36">
      <SectionHeader
        index="03"
        label={t("notes.label")}
        titleA={t("notes.title.a")}
        titleB={t("notes.title.b")}
      />
      <div className="border-t border-line">
        {latest.map((post, i) => (
          <Reveal key={post.slug} delay={i * 60}>
            <Link
              href={`/blog/${post.slug}`}
              className="group grid gap-2 border-b border-line py-7 transition-colors duration-300 hover:bg-raised/60 md:grid-cols-[140px_110px_1fr_auto] md:items-baseline md:gap-6 md:py-8"
            >
              <span className="font-mono text-[11px] text-faint">{formatDate(post.date)}</span>
              <span
                className={`w-fit rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] ${tagColor[post.tagClass]}`}
              >
                {post.tag}
              </span>
              <div>
                <h3 className="font-display text-xl font-bold leading-snug tracking-tight transition-transform duration-300 group-hover:translate-x-1 md:text-2xl">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-dim">
                  {post.excerpt}
                </p>
              </div>
              <span className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                {post.readTime}
                <ArrowUpRight className="size-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-acid" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
      <Reveal delay={120}>
        <div className="mt-8 flex justify-end">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dim transition-colors hover:text-acid"
          >
            All field notes
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
