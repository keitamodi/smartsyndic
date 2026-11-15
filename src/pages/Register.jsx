import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { signInWithProvider } from "@/lib/authMfaFlow";
import MfaFlow from "@/components/MfaFlow";
import { MfaScreen } from "@/components/MfaParts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { authErrorMessage } from "@/lib/authErrors";

const HOME_PATH = "/tableau-de-bord";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [mfaChallenge, setMfaChallenge] = useState(null);

  const raw = safeReturnTo();
  const returnTo = raw === "/" ? HOME_PATH : raw;
  const loginPath = "/login" + (returnTo !== HOME_PATH ? "?returnTo=" + encodeURIComponent(returnTo) : "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email: email.trim(), password });
      setShowOtp(true);
    } catch (err) {
      setError(authErrorMessage(err, "La création du compte a échoué."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: email.trim(), otpCode });
      if (result?.mfa_required) {
        setMfaChallenge(result);
        return;
      }
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = returnTo;
    } catch (err) {
      setError(authErrorMessage(err, "Code invalide ou expiré."));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email.trim());
      toast({
        title: "Code envoyé",
        description: "Consultez votre boîte email pour le nouveau code.",
      });
    } catch (err) {
      setError(authErrorMessage(err, "Le renvoi du code a échoué."));
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

  if (showOtp) {
    return (
      <AuthLayout icon={Mail} title="Vérifiez votre email" subtitle={`Code envoyé à ${email}`}>
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-destructive/10 px-3 py-2 text-[12.5px] leading-relaxed text-destructive"
          >
            {error}
          </div>
        )}

        <div className="mb-6 flex justify-center">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button className="h-11 w-full font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Vérification…
            </>
          ) : (
            "Valider mon email"
          )}
        </Button>

        <div className="mt-4 flex flex-col items-center gap-2 text-[12px] text-muted-foreground">
          <p>
            Vous n’avez rien reçu ?{" "}
            <button type="button" onClick={handleResend} className="font-medium text-primary hover:underline">
              Renvoyer le code
            </button>
          </p>
          <button
            type="button"
            onClick={() => {
              setShowOtp(false);
              setOtpCode("");
              setError("");
            }}
            className="hover:text-foreground hover:underline"
          >
            Changer d’adresse email
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Créer un compte"
      subtitle="Ouvrez l’accès à l’espace de votre syndicat."
      footer={
        <>
          Vous avez déjà un compte ?{" "}
          <Link to={loginPath} className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
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
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmer le mot de passe</Label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" className="h-11 w-full font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création du compte…
            </>
          ) : (
            "Créer mon compte"
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted-foreground">
        Un code de vérification à 6 chiffres vous sera envoyé par email.
      </p>
    </AuthLayout>
  );
}