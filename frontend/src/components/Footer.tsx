import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-primary/30 bg-gradient-primary text-primary-foreground backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-3">
            <div className="text-xl font-bold text-white">Agora FST</div>
            <p className="max-w-sm text-sm text-white/80">
              Une plateforme pour découvrir les clubs, suivre les événements et collaborer sur les projets de l'école.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="font-semibold text-white">Navigation</div>
            <div className="flex flex-col gap-1.5 text-white/75">
              <Link to="/clubs" className="transition-colors hover:text-white">Clubs</Link>
              <Link to="/events" className="transition-colors hover:text-white">Événements</Link>
              <Link to="/projects" className="transition-colors hover:text-white">Projets</Link>
              <Link to="/profile" className="transition-colors hover:text-white">Profil</Link>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="font-semibold text-white">Contact</div>
            <div className="flex items-center gap-2 text-white/75">
              <Mail className="h-4 w-4" />
              <span>contact@agora-fst.local</span>
            </div>
            <div className="flex items-center gap-2 text-white/75">
              <Phone className="h-4 w-4" />
              <span>+216 00 000 000</span>
            </div>
            <div className="flex items-center gap-2 text-white/75">
              <MapPin className="h-4 w-4" />
              <span>Faculté des Sciences de Tunis</span>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-white/20 pt-3 text-sm text-white/65 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Agora FST. Tous droits réservés.</span>
          <span>Conçu pour les étudiants, les enseignants et les clubs.</span>
        </div>
      </div>
    </footer>
  );
};
