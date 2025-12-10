import { HeroSection } from "@/components/landing/HeroSection";
import { TeamTypes } from "@/components/landing/TeamTypes";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhyChooseHackX } from "@/components/landing/WhyChooseKlu";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#050810] via-[#040711] to-[#02040a] text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-[-12%] top-8 h-80 w-80 rounded-full bg-warning/20 blur-3xl" />
        <div className="absolute bottom-[-18%] left-[10%] h-96 w-96 rounded-full bg-secondary/50 blur-3xl" />
      </div>
      <HeroSection />
      <TeamTypes />
      <HowItWorks />
      <WhyChooseHackX />
      <Footer />
    </main>
  );
}
