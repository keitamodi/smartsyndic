// Traduction des messages d'erreur renvoyés par le service d'authentification.
// On garde la règle métier intacte : seul l'affichage est adapté.
export function authErrorMessage(error, fallback = "L'opération a échoué. Réessayez dans un instant.") {
  const raw = String(error?.message || '').toLowerCase();
  if (!raw) return fallback;

  if (raw.includes('verify your email')) {
    return "Votre email n'est pas encore vérifié. Saisissez le code reçu par email, ou recréez le compte pour recevoir un nouveau code.";
  }
  if (raw.includes('invalid') && (raw.includes('credential') || raw.includes('password') || raw.includes('login'))) {
    return 'Email ou mot de passe incorrect.';
  }
  if (raw.includes('already') && (raw.includes('exist') || raw.includes('registered'))) {
    return 'Un compte existe déjà avec cet email. Connectez-vous.';
  }
  if (raw.includes('too many') || raw.includes('rate limit')) {
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  }
  if (raw.includes('network') || raw.includes('fetch') || raw.includes('timeout')) {
    return 'Connexion au serveur impossible. Vérifiez votre réseau puis réessayez.';
  }
  if (raw.includes('code') || raw.includes('otp')) {
    return 'Code invalide ou expiré. Demandez un nouveau code.';
  }
  if (raw.includes('password') && (raw.includes('weak') || raw.includes('short'))) {
    return 'Mot de passe trop faible : utilisez au moins 8 caractères.';
  }
  return error?.message || fallback;
}