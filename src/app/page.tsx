import Hero from "@/components/home/Hero";
import SystemsSection from "@/components/home/SystemsSection";
import CapabilitiesSection from "@/components/home/CapabilitiesSection";
import NotesSection from "@/components/home/NotesSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import ContactSection from "@/components/home/ContactSection";
import Marquee from "@/components/fx/Marquee";

const marqueeItems = [
  "Agents in production",
  "RAG systems",
  "Multilingual NLP",
  "EN · FR · SW",
  "Offline-first",
  "Real-time scoring",
  "Deterministic replay",
  "Built in Nairobi",
  "Shipped worldwide",
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee items={marqueeItems} className="mt-4" />
      <SystemsSection />
      <CapabilitiesSection />
      <NotesSection />
      <TestimonialsSection />
      <ContactSection />
    </>
  );
}
