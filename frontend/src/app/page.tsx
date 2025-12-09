import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { TeamTypes } from "@/components/landing/TeamTypes";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhyChooseHackX } from "@/components/landing/WhyChooseKlu";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      
      <HeroSection />
      <TeamTypes />
      <HowItWorks />
      <WhyChooseHackX />
      <Footer />
        
    </main>
  );
}
