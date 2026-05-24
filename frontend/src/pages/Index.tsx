import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { LatestNewsSection } from "@/components/LatestNewsSection";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <LatestNewsSection />
      <Features />
      <Footer />
    </div>
  );
};

export default Index;
