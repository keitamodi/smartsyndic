import { useState } from 'react';
import { Button } from '@/components/ui/button';
import GoogleIcon from '@/components/GoogleIcon';
import { Loader2 } from 'lucide-react';
import { signInWithProvider } from '@/lib/authMfaFlow';
import { authErrorMessage } from '@/lib/authErrors';

/**
 * Connexion et inscription avec Google en un seul geste : le compte est créé
 * à la première connexion, puis le syndic ouvre son espace de travail.
 * La double authentification, si elle est active, reste gérée par /mfa.
 */
export default function GoogleAuthButton({
  label = 'Continuer avec Google',
  returnTo = '/tableau-de-bord',
  className = '',
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithProvider('google', returnTo);
    } catch (err) {
      setError(authErrorMessage(err, "La connexion avec Google n'a pas abouti. Réessayez."));
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={handleClick}
        className="h-11 w-full gap-2.5 rounded-full bg-card/80 text-[13px] font-medium text-foreground/85"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-[18px] w-[18px]" />}
        {busy ? 'Redirection vers Google…' : label}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-center text-[11.5px] leading-relaxed text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}