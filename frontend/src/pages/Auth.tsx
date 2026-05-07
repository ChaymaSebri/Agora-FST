import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { isStrongPassword, getPasswordPolicyMessage } from "@/lib/passwordValidation";
import { fetchCompetences } from "@/services/api";
import { z } from "zod";
import logo from "@/assets/logo.png";

const authBaseSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(1, { message: "Le mot de passe est requis" }),
});

const loginSchema = authBaseSchema;

const signupSchema = authBaseSchema.extend({
  fullName: z.string().optional(),
  role: z.enum(["etudiant", "enseignant", "club"], {
    message: "Le rôle est obligatoire",
  }),
  confirmPassword: z.string(),
  niveau: z.string().optional(),
  filiere: z.string().optional(),
  grade: z.string().optional(),
  clubName: z.string().optional(),
  clubDescription: z.string().optional(),
  clubSpecialite: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
}).refine((data) => isStrongPassword(data.password), {
  message: getPasswordPolicyMessage(),
  path: ["password"],
});

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
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
  const [signupClubName, setSignupClubName] = useState("");
  const [signupClubDescription, setSignupClubDescription] = useState("");
  const [signupClubSpecialite, setSignupClubSpecialite] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [competences, setCompetences] = useState<Array<{ id: string; nom: string }>>([]);
  const [selectedCompetenceIds, setSelectedCompetenceIds] = useState<string[]>([]);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetModeEmail, setResetModeEmail] = useState("");
  const [resetModeToken, setResetModeToken] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  
  const { signIn, signUp, verifyEmail, resendVerificationCode, requestPasswordReset, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const state = (location.state as { returnTo?: string } | null) ?? null;
  const redirectTo =
    typeof state?.returnTo === "string" && state.returnTo.startsWith("/")
      ? state.returnTo
      : "/";

  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const email = params.get("email") || "";
    const token = params.get("token") || "";

    if (mode === "reset-password" && email && token) {
      setResetModeEmail(email);
      setResetModeToken(token);
      setAuthTab("login");
      setShowForgotPassword(false);
    }
  }, [location.search]);

  useEffect(() => {
    const loadCompetences = async () => {
      try {
        const items = await fetchCompetences();
        console.log('Competences loaded:', items);
        setCompetences(items.map((c) => ({ id: c.id, nom: c.nom })));
      } catch (error) {
        console.error('Failed to load competences:', error);
      }
    };

    loadCompetences();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
      
      setIsLoading(true);
      const { error } = await signIn(loginEmail, loginPassword);
      
      if (error) {
        if (error.message.toLowerCase().includes("verifier votre adresse email")) {
          setPendingVerificationEmail(loginEmail);
          setAuthTab("signup");
        }
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
        navigate(redirectTo, { replace: true });
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

      const { error } = await signUp({
        email: signupEmail,
        password: signupPassword,
        fullName: signupRole === "club" ? undefined : signupFullName,
        role: signupRole,
        niveau: signupRole === "etudiant" ? signupNiveau : undefined,
        filiere: signupRole === "etudiant" ? signupFiliere : undefined,
        grade: signupRole === "enseignant" ? signupGrade : undefined,
        clubName: signupRole === "club" ? signupClubName : undefined,
        clubDescription: signupRole === "club" ? signupClubDescription : undefined,
        clubSpecialite: signupRole === "club" ? signupClubSpecialite : undefined,
        competenceIds: signupRole === "etudiant" ? selectedCompetenceIds : undefined,
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
        setPendingVerificationEmail(signupEmail);
        setVerificationCode("");
        setAuthTab("signup");
        toast({
          title: "Code envoyé",
          description: "Saisissez le code reçu par email pour activer votre compte.",
        });
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

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!pendingVerificationEmail) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Veuillez d'abord creer un compte ou saisir un email a verifier",
            path: ["email"],
          },
        ]);
      }

      if (verificationCode.trim().length !== 6) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Le code doit contenir 6 chiffres",
            path: ["code"],
          },
        ]);
      }

      setIsLoading(true);
      const { error } = await verifyEmail({
        email: pendingVerificationEmail,
        code: verificationCode,
      });

      if (error) {
        toast({
          title: "Erreur de verification",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email verifie",
          description: "Votre compte est maintenant actif.",
        });
        setPendingVerificationEmail("");
        setVerificationCode("");
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

  const handleResendCode = async () => {
    if (!pendingVerificationEmail) {
      toast({
        title: "Email manquant",
        description: "Saisissez d'abord un email a verifier.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error, message } = await resendVerificationCode(pendingVerificationEmail);

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Code renvoye",
        description: message || "Un nouveau code a ete envoye.",
      });
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const email = forgotPasswordEmail.trim();
      if (!email) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Saisissez votre adresse email",
            path: ["email"],
          },
        ]);
      }

      setIsLoading(true);
      const { error, message } = await requestPasswordReset(email);

      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        return;
      }

      toast({
        title: "Lien envoyé",
        description: message || "Si un compte existe, un lien de réinitialisation a été envoyé.",
      });
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Erreur de validation", description: error.errors[0].message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!resetModeEmail || !resetModeToken) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Lien de réinitialisation invalide",
            path: ["token"],
          },
        ]);
      }

      if (resetNewPassword !== resetConfirmPassword) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Les mots de passe ne correspondent pas",
            path: ["confirmPassword"],
          },
        ]);
      }

      if (!isStrongPassword(resetNewPassword)) {
        throw new z.ZodError([
          {
            code: "custom",
            message: getPasswordPolicyMessage(),
            path: ["password"],
          },
        ]);
      }

      setResetPasswordLoading(true);
      const { error } = await resetPassword({
        email: resetModeEmail,
        token: resetModeToken,
        newPassword: resetNewPassword,
      });

      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        return;
      }

      toast({
        title: "Mot de passe réinitialisé",
        description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
      });
      setResetModeEmail("");
      setResetModeToken("");
      setResetNewPassword("");
      setResetConfirmPassword("");
      navigate("/auth", { replace: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Erreur de validation", description: error.errors[0].message, variant: "destructive" });
      }
    } finally {
      setResetPasswordLoading(false);
    }
  };

  if (resetModeEmail && resetModeToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <div className="w-full max-w-xl">
          <div className="flex items-center justify-center mb-8">
            <img src={logo} alt="Agora FST Logo" className="h-16 w-16 object-contain" />
            <span className="ml-3 text-3xl font-bold text-foreground">Agora FST</span>
          </div>

          <Card className="border-border shadow-elegant">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-foreground">Réinitialiser le mot de passe</CardTitle>
              <CardDescription className="text-center">
                Définissez un nouveau mot de passe pour {resetModeEmail}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-password">Nouveau mot de passe</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="reset-password"
                      type={showResetPassword ? "text" : "password"}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Afficher ou masquer le mot de passe"
                      onClick={() => setShowResetPassword((prev) => !prev)}
                    >
                      {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-confirm-password">Confirmer le mot de passe</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="reset-confirm-password"
                      type={showResetConfirmPassword ? "text" : "password"}
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Afficher ou masquer le mot de passe"
                      onClick={() => setShowResetConfirmPassword((prev) => !prev)}
                    >
                      {showResetConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={resetPasswordLoading}>
                  {resetPasswordLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Réinitialisation...
                    </>
                  ) : (
                    "Réinitialiser le mot de passe"
                  )}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/auth", { replace: true })}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à la connexion
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-center mb-8">
          <img
            src={logo}
            alt="Agora FST Logo"
            className="h-16 w-16 object-contain"
          />
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
            <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as "login" | "signup")} className="w-full">
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
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword((prev) => !prev)}
                      className="text-sm text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                </form>

                {showForgotPassword && (
                  <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Réinitialiser le mot de passe</p>
                      <p className="text-sm text-muted-foreground">
                        Entrez votre email et nous vous enverrons un lien de réinitialisation.
                      </p>
                    </div>

                    <form onSubmit={handleForgotPassword} className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="forgot-password-email">Email</Label>
                        <Input
                          id="forgot-password-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" variant="hero" className="flex-1" disabled={isLoading}>
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Envoyer le lien
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)}>
                          Annuler
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
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
                        <Label>Compétences (optionnel)</Label>
                        <p className="text-xs text-muted-foreground">Sélectionnez vos compétences principales.</p>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {competences.map((c) => (
                            <label key={c.id} className="inline-flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={selectedCompetenceIds.includes(c.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedCompetenceIds((s) => Array.from(new Set([...s, c.id])));
                                  else setSelectedCompetenceIds((s) => s.filter((id) => id !== c.id));
                                }}
                              />
                              <span className="truncate">{c.nom}</span>
                            </label>
                          ))}
                        </div>
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

                {pendingVerificationEmail && (
                  <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Verification email requise</p>
                      <p className="text-sm text-muted-foreground">
                        Un code a ete envoye a {pendingVerificationEmail}. Saisissez-le pour activer votre compte.
                      </p>
                    </div>

                    <form onSubmit={handleVerifyEmail} className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="verification-code">Code de verification</Label>
                        <Input
                          id="verification-code"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          placeholder="123456"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                        />
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="submit" variant="hero" className="flex-1" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verification...
                            </>
                          ) : (
                            "Verifier l'email"
                          )}
                        </Button>
                        <Button type="button" variant="outline" className="flex-1" onClick={handleResendCode} disabled={isLoading}>
                          Renvoyer le code
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
