import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingStats } from "@/components/landing/LandingStats";

export default function Home() {
  return (
    <>
      <LandingNav />
      <main className="relative overflow-hidden">
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingStats />
        <LandingCTA />
        <LandingFooter />
      </main>
    </>
  );
}
