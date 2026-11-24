import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import MfaFlow from "@/components/MfaFlow";
import { MfaScreen } from "@/components/MfaParts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";
import { authErrorMessage } from "@/lib/authErrors";
import { inviteKindLabel } from "@/lib/inviteKinds";

const REASONS = {
  introuvable: "Ce lien d’inscription n’est pas valide. Demandez un nouveau lien à votre syndic.",
  deja_utilisee: "Ce lien a déjà été utilisé : connectez-vous avec le mot de passe choisi.",
  expiree: "Ce lien a expiré. Demandez un nouveau lien à votre syndic.",
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("invite") || "";
  const wantedPlan = searchParams.get("plan") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [mfaChallenge, setMfaChallenge] = useState(null);
  const [invite, setInvite] = useState(null);
  const [inviteState, setInviteState] = useState(token ? "checking" : "email");

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    (async () => {
      try {
        const response = await base44.functions.invoke("memberAccess", { action: "check", token });
        const data = response?.data || {};
        if (!active) return;
        if (data.valid) {
          setInvite(data);
          setEmail(data.email || "");
          setInviteState("valid");
        } else {
          setError(REASONS[data.reason] || REASONS.introuvable);
          setInviteState("invalid");
        }
      } catch {
        // Vérification indisponible : l'invitation sera contrôlée à l'activation du compte.
        if (active) setInviteState("valid");
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (invite?.email && email.trim().toLowerCase() !== String(invite.email).toLowerCase()) {
      setError("Utilisez l’adresse email invitée par votre syndic.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      if (!invite) {
        // Inscription syndic : l'espace de travail s'ouvre juste après la vérification de l'email.
        const response = await base44.functions.invoke("memberAccess", {
          action: "checkEmail",
          email: email.trim().toLowerCase(),
          as: "syndic",
        });
        if (!response?.data?.authorized) {
          setError("Cette adresse ne peut pas être utilisée pour créer un compte.");
          return;
        }
      }
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
      // Offre choisie sur la page Tarifs : on enchaîne sur son paiement.
      let destination = invite
        ? "/mon-espace"
        : wantedPlan && wantedPlan !== "free"
          ? `/abonnement?plan=${wantedPlan}`
          : "/tableau-de-bord";
      try {
        const claimed = await base44.functions.invoke("memberAccess", { action: "claim", token });
        if (claimed?.data?.redirect) destination = claimed.data.redirect;
      } catch {
        /* le rattachement se fera automatiquement à la prochaine connexion */
      }
      window.location.href = destination;
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

  if (mfaChallenge) {
    return (
      <MfaScreen>
        <MfaFlow challenge={mfaChallenge} returnTo="/mon-espace" />
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
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
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
        </div>
      </AuthLayout>
    );
  }

  if (inviteState === "checking") {
    return (
      <AuthLayout icon={ShieldCheck} title="Vérification de l’invitation" subtitle="Un instant, nous contrôlons votre lien.">
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }

  if (inviteState === "invalid") {
    return (
      <AuthLayout
        icon={ShieldCheck}
        title="Inscription sur invitation"
        subtitle="L’accès à SyndicVibe est ouvert par votre syndic."
        footer={
          <>
            Vous êtes syndic ?{" "}
            <Link to="/" className="font-medium text-primary hover:underline">
              Découvrir SyndicVibe
            </Link>
          </>
        }
      >
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-destructive/10 px-3 py-2 text-[12.5px] leading-relaxed text-destructive"
          >
            {error}
          </div>
        )}

        <div className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">
          <p>
            Copropriétaires, propriétaires, locataires et techniciens reçoivent de leur syndic un lien personnel, par
            email ou par téléphone. Ce lien permet de choisir un mot de passe et ouvre l’espace correspondant à votre
            statut.
          </p>
          <div className="rounded-xl border border-border/70 bg-secondary/40 p-3 text-[12px]">
            Vous n’avez pas reçu de lien ? Demandez-le à votre syndic : il l’envoie en un clic depuis votre fiche.
          </div>
        </div>

        <Button asChild className="mt-5 h-11 w-full font-medium">
          <Link to="/login">J’ai déjà un compte</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title={invite?.email ? "Créer mon mot de passe" : "Créer mon compte"}
      subtitle={
        invite
          ? `Invitation envoyée par ${invite?.syndic_name || "votre syndic"}.`
          : "Créez votre compte syndic : votre espace de travail s’ouvre juste après la vérification de votre email."
      }
      footer={
        <>
          Vous avez déjà un compte ?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      {invite?.kind && (
        <div className="mb-5 rounded-xl border border-border/70 bg-secondary/40 px-3 py-2.5">
          <p className="text-[12.5px] font-medium text-foreground">
            Accès {inviteKindLabel(invite.kind)}
            {invite.building_name ? ` · ${invite.building_name}` : ""}
          </p>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Votre espace sera ouvert avec les droits de ce statut.
          </p>
        </div>
      )}

      {!invite?.email && (
        <div className="mb-5 rounded-xl border border-border/70 bg-secondary/40 px-3 py-2.5 text-[12px] leading-snug text-muted-foreground">
          {invite
            ? "Votre lien vous a été transmis par téléphone. Indiquez l’adresse email qui servira d’identifiant : c’est elle qui ouvrira votre espace."
            : "Vous ouvrez un espace syndic : utilisez votre adresse professionnelle, elle servira d’identifiant."}
        </div>
      )}

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
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="vous@email.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={!!invite?.email}
              className="h-11 pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
            "Activer mon accès"
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted-foreground">
        Un code de vérification à 6 chiffres vous sera envoyé par email.
      </p>
    </AuthLayout>
  );
}