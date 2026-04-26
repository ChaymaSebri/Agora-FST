// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "@/contexts/AuthContext";
// import { supabase } from "@/integrations/supabase/client";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { toast } from "@/hooks/use-toast";
// import { Loader2, ArrowLeft, Save } from "lucide-react";
// import { z } from "zod";

// const profileSchema = z.object({
//   full_name: z.string().trim().min(1, "Le nom est requis").max(100, "Maximum 100 caractères"),
//   avatar_url: z.string().trim().url("URL invalide").max(500).or(z.literal("")),
// });

// const EditProfile = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [fullName, setFullName] = useState("");
//   const [avatarUrl, setAvatarUrl] = useState("");
//   const [email, setEmail] = useState("");

//   useEffect(() => {
//     if (!user) return;
//     const fetchProfile = async () => {
//       const { data, error } = await supabase
//         .from("profiles")
//         .select("full_name, avatar_url, email")
//         .eq("id", user.id)
//         .maybeSingle();

//       if (error) {
//         toast({ title: "Erreur", description: error.message, variant: "destructive" });
//       } else if (data) {
//         setFullName(data.full_name ?? "");
//         setAvatarUrl(data.avatar_url ?? "");
//         setEmail(data.email ?? "");
//       }
//       setLoading(false);
//     };
//     fetchProfile();
//   }, [user]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!user) return;

//     const result = profileSchema.safeParse({ full_name: fullName, avatar_url: avatarUrl });
//     if (!result.success) {
//       toast({
//         title: "Validation",
//         description: result.error.errors[0].message,
//         variant: "destructive",
//       });
//       return;
//     }

//     setSaving(true);
//     const { error } = await supabase
//       .from("profiles")
//       .update({
//         full_name: result.data.full_name,
//         avatar_url: result.data.avatar_url || null,
//       })
//       .eq("id", user.id);

//     setSaving(false);

//     if (error) {
//       toast({ title: "Erreur", description: error.message, variant: "destructive" });
//     } else {
//       toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
//       navigate("/profile");
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center pt-20">
//         <Loader2 className="w-8 h-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   const initial = (fullName || email).charAt(0).toUpperCase();

//   return (
//     <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
//       <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="mb-4">
//         <ArrowLeft className="w-4 h-4 mr-2" />
//         Retour au profil
//       </Button>

//       <Card>
//         <CardHeader>
//           <CardTitle>Modifier le profil</CardTitle>
//           <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="flex items-center gap-4">
//               <Avatar className="w-20 h-20">
//                 <AvatarImage src={avatarUrl || undefined} alt={fullName} />
//                 <AvatarFallback className="bg-primary text-primary-foreground text-xl">
//                   {initial}
//                 </AvatarFallback>
//               </Avatar>
//               <div className="text-sm text-muted-foreground">
//                 Aperçu de votre avatar
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input id="email" value={email} disabled />
//               <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié ici.</p>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="full_name">Nom complet</Label>
//               <Input
//                 id="full_name"
//                 value={fullName}
//                 onChange={(e) => setFullName(e.target.value)}
//                 placeholder="Votre nom"
//                 maxLength={100}
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="avatar_url">URL de l'avatar</Label>
//               <Input
//                 id="avatar_url"
//                 value={avatarUrl}
//                 onChange={(e) => setAvatarUrl(e.target.value)}
//                 placeholder="https://exemple.com/avatar.jpg"
//                 maxLength={500}
//               />
//             </div>

//             <Button type="submit" variant="hero" disabled={saving} className="w-full">
//               {saving ? (
//                 <>
//                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                   Enregistrement...
//                 </>
//               ) : (
//                 <>
//                   <Save className="w-4 h-4 mr-2" />
//                   Enregistrer
//                 </>
//               )}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default EditProfile;
