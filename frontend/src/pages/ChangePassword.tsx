// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { toast } from "@/hooks/use-toast";
// import { Loader2, ArrowLeft, KeyRound } from "lucide-react";
// import { z } from "zod";

// const passwordSchema = z
//   .object({
//     new_password: z
//       .string()
//       .min(8, "Le mot de passe doit contenir au moins 8 caractères")
//       .max(72, "Maximum 72 caractères"),
//     confirm_password: z.string(),
//   })
//   .refine((data) => data.new_password === data.confirm_password, {
//     message: "Les mots de passe ne correspondent pas",
//     path: ["confirm_password"],
//   });

// const ChangePassword = () => {
//   const navigate = useNavigate();
//   const [saving, setSaving] = useState(false);
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const result = passwordSchema.safeParse({
//       new_password: newPassword,
//       confirm_password: confirmPassword,
//     });
//     if (!result.success) {
//       toast({
//         title: "Validation",
//         description: result.error.errors[0].message,
//         variant: "destructive",
//       });
//       return;
//     }

//     setSaving(true);
//     const { error } = await supabase.auth.updateUser({
//       password: result.data.new_password,
//     });
//     setSaving(false);

//     if (error) {
//       toast({ title: "Erreur", description: error.message, variant: "destructive" });
//     } else {
//       toast({
//         title: "Mot de passe mis à jour",
//         description: "Votre mot de passe a été changé avec succès.",
//       });
//       setNewPassword("");
//       setConfirmPassword("");
//       navigate("/profile");
//     }
//   };

//   return (
//     <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
//       <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="mb-4">
//         <ArrowLeft className="w-4 h-4 mr-2" />
//         Retour au profil
//       </Button>

//       <Card>
//         <CardHeader>
//           <CardTitle>Changer le mot de passe</CardTitle>
//           <CardDescription>
//             Choisissez un nouveau mot de passe sécurisé pour votre compte
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="space-y-2">
//               <Label htmlFor="new_password">Nouveau mot de passe</Label>
//               <Input
//                 id="new_password"
//                 type="password"
//                 value={newPassword}
//                 onChange={(e) => setNewPassword(e.target.value)}
//                 placeholder="••••••••"
//                 maxLength={72}
//                 autoComplete="new-password"
//               />
//               <p className="text-xs text-muted-foreground">Au moins 8 caractères.</p>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
//               <Input
//                 id="confirm_password"
//                 type="password"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 placeholder="••••••••"
//                 maxLength={72}
//                 autoComplete="new-password"
//               />
//             </div>

//             <Button type="submit" variant="hero" disabled={saving} className="w-full">
//               {saving ? (
//                 <>
//                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                   Mise à jour...
//                 </>
//               ) : (
//                 <>
//                   <KeyRound className="w-4 h-4 mr-2" />
//                   Mettre à jour le mot de passe
//                 </>
//               )}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default ChangePassword;
