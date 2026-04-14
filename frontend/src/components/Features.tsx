import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Users, Calendar, BarChart3, Bell, Lightbulb } from "lucide-react";

const features = [
  {
    icon: FolderKanban,
    title: "Gestion de projets",
    description: "Créez et suivez vos projets avec des objectifs clairs, des échéances et des indicateurs de progression.",
  },
  {
    icon: Users,
    title: "Collaboration d'équipe",
    description: "Attribuez des rôles spécifiques et gérez les responsabilités au sein de vos projets.",
  },
  {
    icon: Calendar,
    title: "Événements & Ateliers",
    description: "Publiez et gérez vos événements, conférences et réunions avec inscriptions intégrées.",
  },
  {
    icon: BarChart3,
    title: "Statistiques détaillées",
    description: "Visualisez les performances de vos projets et clubs avec des analyses complètes.",
  },
  {
    icon: Bell,
    title: "Notifications intelligentes",
    description: "Recevez des rappels automatiques pour les échéances et tâches importantes.",
  },
  {
    icon: Lightbulb,
    title: "Recommandations personnalisées",
    description: "Découvrez des projets adaptés à vos intérêts et compétences.",
  },
];

export const Features = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold text-foreground">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Des outils puissants pour gérer efficacement vos clubs et projets étudiants
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-hover transition-all duration-300 border-border hover:border-primary/50"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-gradient-primary transition-all duration-300">
                    <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <CardTitle className="text-foreground">{feature.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
