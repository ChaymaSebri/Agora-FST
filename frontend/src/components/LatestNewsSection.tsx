import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, FolderKanban, Megaphone, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError, fetchLatestNews } from "@/services/api";

export interface NewsItem {
  id: string;
  type: "project" | "event" | "update";
  title: string;
  description: string;
  createdAt: string;
  relatedEntityId?: string | null;
  author?: {
    id?: string | null;
    name?: string | null;
    role?: string | null;
  };
}

interface LatestNewsSectionProps {
  limit?: number;
  showHeaderLink?: boolean;
}

const typeLabel: Record<NewsItem["type"], string> = {
  project: "Projet",
  event: "Evenement",
  update: "Mise a jour",
};

const typeVariant: Record<NewsItem["type"], "default" | "secondary" | "outline"> = {
  project: "default",
  event: "secondary",
  update: "outline",
};

function toDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function itemHref(item: NewsItem) {
  if (item.type === "event") {
    return `/events?focus=${encodeURIComponent(item.relatedEntityId || "")}`;
  }
  return `/projects?focus=${encodeURIComponent(item.relatedEntityId || "")}`;
}

function NewsSkeletonCard() {
  return (
    <Card className="border-border/60">
      <CardHeader className="space-y-3">
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        <div className="h-6 w-4/5 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

export function LatestNewsSection({ limit = 6, showHeaderLink = true }: LatestNewsSectionProps) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchLatestNews({ limit });
        setItems((response.items || []) as NewsItem[]);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Impossible de charger les actualites.";
        setError(message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [limit]);

  useEffect(() => {
    const target = sectionRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  const safeItems = useMemo(() => items.slice(0, limit), [items, limit]);

  return (
    <section ref={sectionRef} className="bg-gradient-to-b from-background via-background to-blue-50/30 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Flux de la plateforme
            </div>
            <h2 className="text-4xl font-bold text-foreground">Dernieres actualites</h2>
            <p className="max-w-2xl text-muted-foreground">
              Suivez les derniers projets, evenements et mises a jour importantes des clubs et des etudiants.
            </p>
          </div>
          {showHeaderLink ? (
            <Button asChild variant="outline" className="w-fit">
              <Link to="/news">Voir plus</Link>
            </Button>
          ) : null}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <NewsSkeletonCard key={index} />
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-destructive">{error}</p>
              <Button asChild variant="secondary">
                <Link to="/news">Voir les actualites</Link>
              </Button>
            </CardContent>
          </Card>
        ) : safeItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">Aucune actualite recente.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {safeItems.map((item, index) => (
              <Card
                key={item.id}
                className={`border-border/60 transition-all duration-500 ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={typeVariant[item.type]}>{typeLabel[item.type]}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {toDateLabel(item.createdAt)}
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2 text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {item.type === "event" ? <Megaphone className="h-3.5 w-3.5" /> : <FolderKanban className="h-3.5 w-3.5" />}
                      {item.author?.name || "Auteur inconnu"}
                    </div>
                    <Button asChild size="sm" variant="ghost" className="text-primary hover:text-primary/90">
                      <Link to={itemHref(item)}>Voir</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
