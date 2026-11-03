import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { posts, formatDate } from "@/lib/posts";
import Reveal from "@/components/fx/Reveal";

export const metadata: Metadata = {
  title: "Field Notes",
  description:
    "Research and engineering notes from building AI systems in production — state-of-AI reports, multi-agent architectures, agricultural AI and agent reliability.",
  alternates: { canonical: "/blog" },
};

const tagColor: Record<string, string> = {
  ai: "text-acid border-acid/30",
  engineering: "text-amber border-amber/30",
  research: "text-sky-300 border-sky-300/30",
  agri: "text-emerald-300 border-emerald-300/30",
};

export default function BlogPage() {
  return (
    <div className="container-x pb-8 pt-28 md:pt-36">
      <Reveal>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
          Field Notes — {posts.length} posts
        </p>
      </Reveal>
      <Reveal delay={80}>
        <h1 className="mt-6 font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-7xl">
          Notes from <span className="text-acid">the build.</span>
        </h1>
      </Reveal>
      <Reveal delay={140}>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-dim">
          What I learn while shipping — state-of-AI field reports, multi-agent
          architecture deep-dives, agricultural AI under real constraints, and agent
          reliability research.
        </p>
      </Reveal>

      <div className="mt-12 border-t border-line">
        {posts.map((post, i) => (
          <Reveal key={post.slug} delay={Math.min(i, 3) * 50}>
            <Link
              href={`/blog/${post.slug}`}
              className="group grid gap-2 border-b border-line py-7 transition-colors duration-300 hover:bg-raised/60 md:grid-cols-[140px_110px_1fr_auto] md:items-baseline md:gap-6"
            >
              <span className="font-mono text-[11px] text-faint">{formatDate(post.date)}</span>
              <span
                className={`w-fit rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] ${tagColor[post.tagClass]}`}
              >
                {post.tag}
              </span>
              <div>
                <h2 className="font-display text-xl font-bold leading-snug tracking-tight transition-transform duration-300 group-hover:translate-x-1 md:text-2xl">
                  {post.title}
                </h2>
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
    </div>
  );
}
