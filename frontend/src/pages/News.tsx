import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LatestNewsSection } from "@/components/LatestNewsSection";

export default function News() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <LatestNewsSection limit={18} showHeaderLink={false} />
      </div>
      <Footer />
    </div>
  );
}
