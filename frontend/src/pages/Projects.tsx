// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { ProjectCard, Project } from "@/components/ProjectCard";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Search, Plus, Filter } from "lucide-react";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// const mockProjects: Project[] = [
//   {
//     id: "1",
//     title: "Application de covoiturage étudiant",
//     description: "Développement d'une plateforme mobile pour faciliter le covoiturage entre étudiants du campus.",
//     progress: 75,
//     category: "Technologie",
//     deadline: "15 Déc 2025",
//     members: 8,
//     status: "active",
//   },
//   {
//     id: "2",
//     title: "Festival culturel inter-campus",
//     description: "Organisation d'un festival mettant en avant la diversité culturelle des étudiants.",
//     progress: 45,
//     category: "Événementiel",
//     deadline: "30 Jan 2026",
//     members: 15,
//     status: "active",
//   },
//   {
//     id: "3",
//     title: "Initiative zéro déchet",
//     description: "Projet environnemental pour réduire l'empreinte carbone du campus.",
//     progress: 100,
//     category: "Environnement",
//     deadline: "1 Nov 2025",
//     members: 12,
//     status: "completed",
//   },
//   {
//     id: "4",
//     title: "Hackathon IA & Innovation",
//     description: "Compétition de 48h autour de l'intelligence artificielle et l'innovation technologique.",
//     progress: 20,
//     category: "Technologie",
//     deadline: "20 Fév 2026",
//     members: 25,
//     status: "planning",
//   },
//   {
//     id: "5",
//     title: "Mentorat académique",
//     description: "Programme de soutien académique par les pairs pour les étudiants de première année.",
//     progress: 60,
//     category: "Éducation",
//     deadline: "10 Déc 2025",
//     members: 20,
//     status: "active",
//   },
//   {
//     id: "6",
//     title: "Podcast étudiant",
//     description: "Création d'une série de podcasts sur la vie étudiante et les parcours inspirants.",
//     progress: 85,
//     category: "Média",
//     deadline: "5 Déc 2025",
//     members: 6,
//     status: "active",
//   },
// ];

// const Projects = () => {
//   const navigate = useNavigate();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterStatus, setFilterStatus] = useState<string>("all");

//   const filteredProjects = mockProjects.filter((project) => {
//     const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filterStatus === "all" || project.status === filterStatus;
//     return matchesSearch && matchesFilter;
//   });

//   return (
//     <div className="min-h-screen bg-background pt-24 pb-12">
//       <div className="container mx-auto px-4">
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
//           <div>
//             <h1 className="text-4xl font-bold text-foreground mb-2">Projets</h1>
//             <p className="text-muted-foreground">
//               Découvrez et rejoignez les projets étudiants actifs
//             </p>
//           </div>
//           <Button variant="hero" size="lg" className="md:self-start" onClick={() => navigate("/projects/new")}>
//             <Plus className="w-4 h-4 mr-2" />
//             Nouveau projet
//           </Button>
//         </div>

//         <div className="flex flex-col md:flex-row gap-4 mb-8">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//             <Input
//               placeholder="Rechercher un projet..."
//               className="pl-10"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>
//           <Select value={filterStatus} onValueChange={setFilterStatus}>
//             <SelectTrigger className="w-full md:w-[200px]">
//               <Filter className="w-4 h-4 mr-2" />
//               <SelectValue placeholder="Filtrer par statut" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">Tous les projets</SelectItem>
//               <SelectItem value="active">En cours</SelectItem>
//               <SelectItem value="planning">Planification</SelectItem>
//               <SelectItem value="completed">Terminés</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredProjects.map((project) => (
//             <ProjectCard key={project.id} project={project} />
//           ))}
//         </div>

//         {filteredProjects.length === 0 && (
//           <div className="text-center py-12">
//             <p className="text-muted-foreground text-lg">
//               Aucun projet ne correspond à vos critères de recherche
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Projects;
