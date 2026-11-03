import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getPost, posts, formatDate } from "@/lib/posts";
import { postContent } from "@/data/post-content";
import Reveal from "@/components/fx/Reveal";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [site.name],
      images: post.ogImage ? [{ url: post.ogImage }] : [{ url: "/og-image.png" }],
    },
  };
}

const tagColor: Record<string, string> = {
  ai: "text-acid border-acid/30",
  engineering: "text-amber border-amber/30",
  research: "text-sky-300 border-sky-300/30",
  agri: "text-emerald-300 border-emerald-300/30",
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  const content = postContent[slug];
  if (!post || !content) notFound();

  const idx = posts.findIndex((p) => p.slug === slug);
  const next = posts[(idx + 1) % posts.length];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Person", name: site.name, url: site.url },
    publisher: { "@type": "Person", name: site.name },
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
    inLanguage: "en",
  };

  return (
    <article className="container-x pb-8 pt-28 md:pt-36">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Reveal>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-dim transition-colors hover:text-acid"
        >
          <ArrowLeft className="size-3.5" /> All field notes
        </Link>
      </Reveal>

      <Reveal delay={60}>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <span
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] ${tagColor[post.tagClass]}`}
          >
            {post.tag}
          </span>
          <span className="font-mono text-[11px] text-faint">{formatDate(post.date)}</span>
          <span className="font-mono text-[11px] text-faint">
            {post.readTime} · {post.wordCount.toLocaleString("en-US")} words
          </span>
        </div>
      </Reveal>

      <Reveal delay={110}>
        <h1 className="mt-6 max-w-4xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
          {post.title}
        </h1>
      </Reveal>

      <Reveal delay={170}>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-dim">{post.excerpt}</p>
      </Reveal>

      <Reveal delay={220}>
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] text-faint"
            >
              #{tag}
            </span>
          ))}
        </div>
      </Reveal>

      <Reveal delay={260}>
        <div
          className="article mt-14 max-w-3xl"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </Reveal>

      <div className="mt-20 max-w-3xl border-t border-line pt-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
          Written by
        </p>
        <div className="mt-4 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/profile-pic-800.png"
            alt="Victor Ndunda"
            width={52}
            height={52}
            className="size-[52px] rounded-full border border-line object-cover"
          />
          <div>
            <p className="font-display text-lg font-bold">Victor Ndunda</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              AI Systems Engineer — Nairobi, Kenya
            </p>
          </div>
        </div>
      </div>

      <Link
        href={`/blog/${next.slug}`}
        className="group mt-14 flex items-center justify-between gap-6 border border-line p-7 transition-colors hover:border-acid/30 md:p-9"
      >
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
            Next field note
          </span>
          <h3 className="mt-2 font-display text-xl font-bold leading-snug tracking-tight transition-transform duration-300 group-hover:translate-x-1 md:text-2xl">
            {next.title}
          </h3>
        </div>
        <ArrowRight
          className="size-6 shrink-0 text-faint transition-all duration-300 group-hover:translate-x-1 group-hover:text-acid"
          aria-hidden="true"
        />
      </Link>
    </article>
  );
}
