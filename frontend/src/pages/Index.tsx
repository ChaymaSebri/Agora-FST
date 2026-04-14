import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Navbar } from "@/components/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
    </div>
  );
};

export default Index;
