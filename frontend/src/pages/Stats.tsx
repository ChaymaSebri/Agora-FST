// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { BarChart3, TrendingUp, Users, FolderKanban, Calendar, Award } from "lucide-react";
// import { Progress } from "@/components/ui/progress";

// const Stats = () => {
//   const stats = [
//     {
//       icon: FolderKanban,
//       label: "Projets actifs",
//       value: "150",
//       change: "+12%",
//       trend: "up",
//     },
//     {
//       icon: Users,
//       label: "Étudiants engagés",
//       value: "2,048",
//       change: "+18%",
//       trend: "up",
//     },
//     {
//       icon: Calendar,
//       label: "Événements ce mois",
//       value: "42",
//       change: "+8%",
//       trend: "up",
//     },
//     {
//       icon: Award,
//       label: "Projets terminés",
//       value: "89",
//       change: "+25%",
//       trend: "up",
//     },
//   ];

//   const topProjects = [
//     { name: "Application de covoiturage", completion: 75, members: 8 },
//     { name: "Podcast étudiant", completion: 85, members: 6 },
//     { name: "Initiative zéro déchet", completion: 100, members: 12 },
//     { name: "Festival culturel", completion: 45, members: 15 },
//     { name: "Mentorat académique", completion: 60, members: 20 },
//   ];

//   const topClubs = [
//     { name: "Club Technologie", projects: 23, members: 156 },
//     { name: "Club Environnement", projects: 15, members: 98 },
//     { name: "Club Événementiel", projects: 18, members: 142 },
//     { name: "Club Innovation", projects: 20, members: 178 },
//   ];

//   return (
//     <div className="min-h-screen bg-background pt-24 pb-12">
//       <div className="container mx-auto px-4">
//         <div className="mb-8">
//           <h1 className="text-4xl font-bold text-foreground mb-2">Statistiques</h1>
//           <p className="text-muted-foreground">
//             Vue d'ensemble de l'activité des clubs et projets
//           </p>
//         </div>

//         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           {stats.map((stat, index) => {
//             const Icon = stat.icon;
//             return (
//               <Card key={index} className="border-border hover:shadow-hover transition-all duration-300">
//                 <CardHeader className="flex flex-row items-center justify-between pb-2">
//                   <CardTitle className="text-sm font-medium text-muted-foreground">
//                     {stat.label}
//                   </CardTitle>
//                   <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
//                     <Icon className="w-4 h-4 text-primary" />
//                   </div>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
//                   <div className="flex items-center gap-1 text-sm text-accent">
//                     <TrendingUp className="w-4 h-4" />
//                     <span>{stat.change} ce mois</span>
//                   </div>
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>

//         <div className="grid lg:grid-cols-2 gap-6 mb-8">
//           <Card className="border-border">
//             <CardHeader>
//               <CardTitle className="text-foreground">Projets les plus actifs</CardTitle>
//               <CardDescription>
//                 Classés par taux d'avancement et engagement
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               {topProjects.map((project, index) => (
//                 <div key={index} className="space-y-2">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="font-medium text-foreground">{project.name}</span>
//                     <div className="flex items-center gap-4 text-muted-foreground">
//                       <span className="flex items-center gap-1">
//                         <Users className="w-3 h-3" />
//                         {project.members}
//                       </span>
//                       <span className="font-semibold text-foreground">{project.completion}%</span>
//                     </div>
//                   </div>
//                   <Progress value={project.completion} className="h-2" />
//                 </div>
//               ))}
//             </CardContent>
//           </Card>

//           <Card className="border-border">
//             <CardHeader>
//               <CardTitle className="text-foreground">Clubs les plus actifs</CardTitle>
//               <CardDescription>
//                 Classés par nombre de projets et membres
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {topClubs.map((club, index) => (
//                 <div
//                   key={index}
//                   className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
//                 >
//                   <div>
//                     <div className="font-medium text-foreground">{club.name}</div>
//                     <div className="text-sm text-muted-foreground mt-1">
//                       {club.members} membres actifs
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-2xl font-bold text-primary">{club.projects}</div>
//                     <div className="text-xs text-muted-foreground">projets</div>
//                   </div>
//                 </div>
//               ))}
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="border-border">
//           <CardHeader>
//             <CardTitle className="text-foreground">Répartition par catégorie</CardTitle>
//             <CardDescription>
//               Distribution des projets selon leur domaine
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {[
//                 { category: "Technologie", count: 42, color: "bg-primary" },
//                 { category: "Événementiel", count: 35, color: "bg-accent" },
//                 { category: "Environnement", count: 28, color: "bg-primary-glow" },
//                 { category: "Éducation", count: 25, color: "bg-accent-light" },
//                 { category: "Média", count: 20, color: "bg-primary/70" },
//               ].map((item, index) => (
//                 <div key={index} className="space-y-2">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="font-medium text-foreground">{item.category}</span>
//                     <span className="text-muted-foreground">{item.count} projets</span>
//                   </div>
//                   <div className="h-3 bg-secondary rounded-full overflow-hidden">
//                     <div
//                       className={`h-full ${item.color} rounded-full transition-all duration-500`}
//                       style={{ width: `${(item.count / 42) * 100}%` }}
//                     />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default Stats;
