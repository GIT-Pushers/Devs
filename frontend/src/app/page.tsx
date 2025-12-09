import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TeamTypes } from "@/components/landing/TeamTypes";
import { WhyChooseHackX } from "@/components/landing/WhyChooseKlu";
import { Footer } from "@/components/landing/Footer";
import { BackgroundLights } from "@/components/landing/BackgroundLights";

export default function Home() {
  return (
    <main className="min-h-screen bg-black relative">
      <BackgroundLights />
      <Header />
      <HeroSection />
      <HowItWorks />
      <TeamTypes />
      <WhyChooseHackX />
      <Footer />
    </main>
  );
}
