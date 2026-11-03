import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-svh flex-col items-start justify-center pt-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
        Error 404
      </p>
      <h1 className="mt-6 font-display text-[clamp(3rem,10vw,7rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
        This route <span className="text-acid">never shipped.</span>
      </h1>
      <p className="mt-6 max-w-md text-[15px] leading-relaxed text-dim">
        Everything that did ship is one click away — thirteen systems, thirteen field
        notes, one engineer in Nairobi.
      </p>
      <Link
        href="/"
        className="group mt-10 inline-flex items-center gap-3 bg-acid px-7 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#070808] transition-colors hover:bg-[#d8ff6e]"
      >
        <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
        Back to base
      </Link>
    </div>
  );
}
