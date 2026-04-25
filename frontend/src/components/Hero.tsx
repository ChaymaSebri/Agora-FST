import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import FST from "@/assets/FST.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background"></div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Nouvelle ère de collaboration étudiante</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Gérez vos projets et clubs
              <span className="bg-gradient-primary bg-clip-text text-transparent"> étudiants</span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Une plateforme moderne pour centraliser vos activités, coordonner vos équipes et suivre vos projets en temps réel.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg" className="group" asChild>
                <a href="/auth">
                  Commencer maintenant
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="/projects">Découvrir les projets</a>
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-foreground">150+</div>
                <div className="text-sm text-muted-foreground">Projets actifs</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <div className="text-3xl font-bold text-foreground">2,000+</div>
                <div className="text-sm text-muted-foreground">Étudiants engagés</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <div className="text-3xl font-bold text-foreground">50+</div>
                <div className="text-sm text-muted-foreground">Clubs partenaires</div>
              </div>
            </div>
          </div>
          
          <div className="relative animate-slide-up hidden md:block">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full"></div>
            <img
              src={FST}
              alt="Étudiants collaborant sur des projets"
              className="relative rounded-2xl shadow-hover w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
};
