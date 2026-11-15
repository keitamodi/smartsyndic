import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const UserNotRegisteredError = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[440px] rounded-[24px] border border-border bg-card p-8 text-center shadow-[0_28px_60px_-45px_rgba(41,25,15,0.55)]">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
          <ShieldAlert className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <h1 className="font-heading text-[24px] font-semibold leading-tight tracking-[-0.03em]">Accès non autorisé</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Ce compte n’est pas encore rattaché à un espace syndic. Vérifiez que vous êtes connecté avec l’adresse email
          invitée, ou demandez l’accès à l’administrateur de votre cabinet.
        </p>
        <div className="mt-5 rounded-xl border border-border/70 bg-secondary/30 p-4 text-left text-[12px] leading-relaxed text-foreground/75">
          <p className="font-medium text-foreground">Que faire ?</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4">
            <li>Vérifier l’adresse email utilisée pour la connexion</li>
            <li>Demander une invitation à l’administrateur du cabinet</li>
            <li>Se déconnecter puis se reconnecter avec le bon compte</li>
          </ul>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={() => base44.auth.logout('/login')}>Se reconnecter</Button>
          <Button asChild variant="ghost" className="text-[12.5px] text-muted-foreground">
            <Link to="/">Retour à l’accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;