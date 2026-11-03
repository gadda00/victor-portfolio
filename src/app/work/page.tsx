import type { Metadata } from "next";
import WorkIndex from "@/components/work/WorkIndex";

export const metadata: Metadata = {
  title: "Work — 13 systems shipped",
  description:
    "Client platforms in public trial, owned products in production and open-source tools in the wild — Keja AI, Tapi Learn, FirstLight, Busara AI, AgentReplay and more.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return <WorkIndex />;
}
