import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Loader2, Eye, EyeOff } from "lucide-react";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().optional(),
  role: z.enum(["etudiant", "enseignant", "club"], {
    message: "Le rôle est obligatoire",
  }),
  confirmPassword: z.string(),
  niveau: z.string().optional(),
  filiere: z.string().optional(),
  grade: z.string().optional(),
  specialite: z.string().optional(),
  clubName: z.string().optional(),
  clubDescription: z.string().optional(),
  clubSpecialite: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupRole, setSignupRole] = useState<string>("etudiant");
  const [signupNiveau, setSignupNiveau] = useState("");
  const [signupFiliere, setSignupFiliere] = useState("");
  const [signupGrade, setSignupGrade] = useState("");
  const [signupSpecialite, setSignupSpecialite] = useState("");
  const [signupClubName, setSignupClubName] = useState("");
  const [signupClubDescription, setSignupClubDescription] = useState("");
  const [signupClubSpecialite, setSignupClubSpecialite] = useState("");
  const [signupPhotoFile, setSignupPhotoFile] = useState<File | null>(null);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignupPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] || null;
    setSignupPhotoFile(nextFile);
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
      
      setIsLoading(true);
      const { error } = await signIn(loginEmail, loginPassword);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Erreur de connexion",
            description: "Email ou mot de passe incorrect",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erreur",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue !",
        });
        navigate("/");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      signupSchema.parse({
        email: signupEmail,
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
        fullName: signupRole === "club" ? undefined : signupFullName,
        role: signupRole as "etudiant" | "enseignant" | "club",
        niveau: signupNiveau,
        filiere: signupFiliere,
        grade: signupGrade,
        specialite: signupSpecialite,
        clubName: signupClubName,
        clubDescription: signupClubDescription,
        clubSpecialite: signupClubSpecialite,
      });

      if (signupRole !== "club" && signupFullName.trim().length < 2) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Le nom complet doit contenir au moins 2 caractères",
            path: ["fullName"],
          },
        ]);
      }

      if (signupRole === "club" && signupClubName.trim().length < 2) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Le nom du club doit contenir au moins 2 caractères",
            path: ["clubName"],
          },
        ]);
      }
      
      setIsLoading(true);

      let uploadedAvatarUrl: string | undefined;
      if (signupPhotoFile) {
        uploadedAvatarUrl = await uploadImageToCloudinary(signupPhotoFile);
      }

      const { error } = await signUp({
        email: signupEmail,
        password: signupPassword,
        fullName: signupRole === "club" ? undefined : signupFullName,
        role: signupRole,
        niveau: signupRole === "etudiant" ? signupNiveau : undefined,
        filiere: signupRole === "etudiant" ? signupFiliere : undefined,
        grade: signupRole === "enseignant" ? signupGrade : undefined,
        specialite:
          signupRole === "etudiant" || signupRole === "enseignant"
            ? signupSpecialite
            : undefined,
        clubName: signupRole === "club" ? signupClubName : undefined,
        clubDescription: signupRole === "club" ? signupClubDescription : undefined,
        clubSpecialite: signupRole === "club" ? signupClubSpecialite : undefined,
        avatarUrl: uploadedAvatarUrl,
      });
      
      if (error) {
        if (error.message.toLowerCase().includes("existe deja")) {
          toast({
            title: "Compte existant",
            description: "Un compte avec cet email existe déjà",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erreur",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Compte créé",
          description: "Votre compte a été créé avec succès !",
        });
        navigate("/");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="p-3 bg-gradient-primary rounded-xl">
            <Rocket className="w-8 h-8 text-primary-foreground" />
          </div>
          <span className="ml-3 text-3xl font-bold text-foreground">Agora FST</span>
        </div>

        <Card className="border-border shadow-elegant">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-foreground">Bienvenue</CardTitle>
            <CardDescription className="text-center">
              Connectez-vous ou créez un compte pour continuer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Afficher ou masquer le mot de passe"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Rôle</Label>
                    <Select value={signupRole} onValueChange={setSignupRole}>
                      <SelectTrigger id="signup-role">
                        <SelectValue placeholder="Choisir un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="etudiant">Étudiant</SelectItem>
                        <SelectItem value="enseignant">Enseignant</SelectItem>
                        <SelectItem value="club">Club</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {signupRole !== "club" && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nom complet</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Jean Dupont"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  {signupRole === "etudiant" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-niveau">Niveau</Label>
                        <Input
                          id="signup-niveau"
                          type="text"
                          placeholder="L3"
                          value={signupNiveau}
                          onChange={(e) => setSignupNiveau(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-filiere">Filière</Label>
                        <Input
                          id="signup-filiere"
                          type="text"
                          placeholder="Informatique"
                          value={signupFiliere}
                          onChange={(e) => setSignupFiliere(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-specialite-etudiant">Spécialité (optionnel)</Label>
                        <Input
                          id="signup-specialite-etudiant"
                          type="text"
                          placeholder="IA, Web, Cybersécurité..."
                          value={signupSpecialite}
                          onChange={(e) => setSignupSpecialite(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  {signupRole === "enseignant" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-grade">Grade</Label>
                        <Input
                          id="signup-grade"
                          type="text"
                          placeholder="Maître de conférences"
                          value={signupGrade}
                          onChange={(e) => setSignupGrade(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-specialite-enseignant">Spécialité (optionnel)</Label>
                        <Input
                          id="signup-specialite-enseignant"
                          type="text"
                          placeholder="Génie logiciel, Data..."
                          value={signupSpecialite}
                          onChange={(e) => setSignupSpecialite(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  {signupRole === "club" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-club-name">Nom du club</Label>
                        <Input
                          id="signup-club-name"
                          type="text"
                          placeholder="Club Robotique"
                          value={signupClubName}
                          onChange={(e) => setSignupClubName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-club-description">Description du club (optionnel)</Label>
                        <Input
                          id="signup-club-description"
                          type="text"
                          placeholder="Innovation, robotique et competitions"
                          value={signupClubDescription}
                          onChange={(e) => setSignupClubDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-club-specialite">Spécialité du club (optionnel)</Label>
                        <Input
                          id="signup-club-specialite"
                          type="text"
                          placeholder="Robotique, Entrepreneuriat..."
                          value={signupClubSpecialite}
                          onChange={(e) => setSignupClubSpecialite(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="signup-photo">Photo (optionnel)</Label>
                    <Input
                      id="signup-photo"
                      type="file"
                      accept="image/*"
                      onChange={handleSignupPhotoChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Sélectionnez une image depuis votre galerie. Elle sera stockée sur Cloudinary.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Afficher ou masquer le mot de passe"
                        onClick={() => setShowSignupPassword((prev) => !prev)}
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmer le mot de passe</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="signup-confirm"
                        type={showSignupConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Afficher ou masquer la confirmation du mot de passe"
                        onClick={() => setShowSignupConfirmPassword((prev) => !prev)}
                      >
                        {showSignupConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer un compte"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
