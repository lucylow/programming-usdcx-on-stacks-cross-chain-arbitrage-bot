import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturesSection } from "@/components/FeaturesSection";
import { StacksFeaturesSection } from "@/components/StacksFeaturesSection";
import { SolutionSection } from "@/components/SolutionSection";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <FeaturesSection />
        <StacksFeaturesSection />
        <SolutionSection />
        <InteractiveDemo />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
