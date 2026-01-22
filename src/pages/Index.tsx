import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProblemSection } from "@/components/ProblemSection";
import { SolutionSection } from "@/components/SolutionSection";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { FeaturesSection } from "@/components/FeaturesSection";
import { ZephyrSection } from "@/components/ZephyrSection";
import { TeamSection } from "@/components/TeamSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <InteractiveDemo />
        <FeaturesSection />
        <ZephyrSection />
        <TeamSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
