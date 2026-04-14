// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useToast } from "@/hooks/use-toast";
// import { FolderKanban, Loader2, Calendar, ArrowLeft } from "lucide-react";
// import { z } from "zod";

// const projectSchema = z.object({
//   title: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(100),
//   description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(500),
//   category: z.string().min(1, "Veuillez sélectionner une catégorie"),
//   deadline: z.string().min(1, "Veuillez sélectionner une date limite"),
// });

// const CreateProject = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [category, setCategory] = useState("");
//   const [deadline, setDeadline] = useState("");
  
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     try {
//       projectSchema.parse({ title, description, category, deadline });
      
//       setIsLoading(true);
      
//       // Simulate project creation (you'll implement actual database logic)
//       await new Promise((resolve) => setTimeout(resolve, 1000));
      
//       toast({
//         title: "Projet créé",
//         description: "Le projet a été créé avec succès !",
//       });
      
//       navigate("/projects");
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         toast({
//           title: "Erreur de validation",
//           description: error.errors[0].message,
//           variant: "destructive",
//         });
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background pt-24 pb-12">
//       <div className="container mx-auto px-4 max-w-3xl">
//         <Button
//           variant="ghost"
//           onClick={() => navigate("/projects")}
//           className="mb-6"
//         >
//           <ArrowLeft className="w-4 h-4 mr-2" />
//           Retour aux projets
//         </Button>

//         <div className="flex items-center gap-3 mb-8">
//           <div className="p-2 bg-gradient-primary rounded-lg">
//             <FolderKanban className="w-6 h-6 text-primary-foreground" />
//           </div>
//           <div>
//             <h1 className="text-4xl font-bold text-foreground">Créer un projet</h1>
//             <p className="text-muted-foreground">Lancez un nouveau projet pour votre club</p>
//           </div>
//         </div>

//         <Card className="border-border shadow-elegant">
//           <CardHeader>
//             <CardTitle className="text-foreground">Informations du projet</CardTitle>
//             <CardDescription>
//               Remplissez les détails de votre projet
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleSubmit} className="space-y-6">
//               <div className="space-y-2">
//                 <Label htmlFor="title">Titre du projet *</Label>
//                 <Input
//                   id="title"
//                   placeholder="Ex: Application de covoiturage"
//                   value={title}
//                   onChange={(e) => setTitle(e.target.value)}
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="description">Description *</Label>
//                 <Textarea
//                   id="description"
//                   placeholder="Décrivez votre projet en quelques lignes..."
//                   value={description}
//                   onChange={(e) => setDescription(e.target.value)}
//                   required
//                   rows={5}
//                 />
//                 <p className="text-xs text-muted-foreground">
//                   {description.length}/500 caractères
//                 </p>
//               </div>

//               <div className="grid md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <Label htmlFor="category">Catégorie *</Label>
//                   <Select value={category} onValueChange={setCategory}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Sélectionnez une catégorie" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="Technologie">Technologie</SelectItem>
//                       <SelectItem value="Événementiel">Événementiel</SelectItem>
//                       <SelectItem value="Environnement">Environnement</SelectItem>
//                       <SelectItem value="Éducation">Éducation</SelectItem>
//                       <SelectItem value="Média">Média</SelectItem>
//                       <SelectItem value="Social">Social</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="deadline">Date limite *</Label>
//                   <div className="relative">
//                     <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
//                     <Input
//                       id="deadline"
//                       type="date"
//                       className="pl-10"
//                       value={deadline}
//                       onChange={(e) => setDeadline(e.target.value)}
//                       required
//                       min={new Date().toISOString().split("T")[0]}
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="flex gap-4 pt-4">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => navigate("/projects")}
//                   className="flex-1"
//                 >
//                   Annuler
//                 </Button>
//                 <Button
//                   type="submit"
//                   variant="hero"
//                   disabled={isLoading}
//                   className="flex-1"
//                 >
//                   {isLoading ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       Création...
//                     </>
//                   ) : (
//                     "Créer le projet"
//                   )}
//                 </Button>
//               </div>
//             </form>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default CreateProject;
