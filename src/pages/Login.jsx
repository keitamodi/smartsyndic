import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loginWithMfa } from "@/lib/authMfa";
import { signInWithProvider } from "@/lib/authMfaFlow";
import MfaFlow from "@/components/MfaFlow";
import { MfaScreen } from "@/components/MfaParts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";
import { authErrorMessage } from "@/lib/authErrors";
import { useAuth } from "@/lib/AuthContext";

const HOME_PATH = "/tableau-de-bord";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState(null);
  const { isAuthenticated } = useAuth();

  // Après connexion, on ouvre l'espace de travail ; un ?returnTo= explicite reste prioritaire.
  const raw = safeReturnTo();
  const returnTo = raw === "/" ? HOME_PATH : raw;

  // Un utilisateur déjà connecté n'a rien à faire sur la page de connexion.
  useEffect(() => {
    if (isAuthenticated) window.location.replace(returnTo);
  }, [isAuthenticated, returnTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginWithMfa(email.trim(), password);
      if (result.mfa_required) {
        setMfaChallenge(result);
        return;
      }
      window.location.href = returnTo;
    } catch (err) {
      setError(authErrorMessage(err, 'Email ou mot de passe incorrect.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithProvider("google", returnTo);
    } catch (err) {
      setError(authErrorMessage(err, 'La connexion avec Google a échoué.'));
    }
  };

  if (mfaChallenge) {
    return (
      <MfaScreen>
        <MfaFlow challenge={mfaChallenge} returnTo={returnTo} />
      </MfaScreen>
    );
  }

  return (
    <AuthLayout
      icon={LogIn}
      title="Connexion"
      subtitle="Accédez à l’espace de votre syndicat."
      footer={
        <>
          Votre accès est créé par votre syndic : il vous envoie un lien d’inscription par email.
        </>
      }
    >
      <Button variant="outline" className="mb-6 h-11 w-full text-[13px] font-medium" onClick={handleGoogle}>
        <GoogleIcon className="mr-2 h-5 w-5" />
        Continuer avec Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.16em]">
          <span className="bg-card px-3 text-muted-foreground">ou</span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-destructive/10 px-3 py-2 text-[12.5px] leading-relaxed text-destructive"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="vous@cabinet.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link to="/forgot-password" className="text-[11.5px] text-primary hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" className="h-11 w-full font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion…
            </>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>

      <p className="mt-5 border-t border-border/70 pt-4 text-center text-[11.5px] leading-relaxed text-muted-foreground">
        Vous êtes syndic et découvrez SyndicVibe ?{" "}
        <Link to="/" className="font-medium text-primary hover:underline">
          Demander une inscription
        </Link>
      </p>
    </AuthLayout>
  );
}