// Ouvre la page de paiement Stripe : nouvel onglet dans l'aperçu (iframe),
// navigation pleine page une fois l'app ouverte directement.
// Retourne false si le navigateur a bloqué l'ouverture (l'appelant propose alors le lien direct).
export function openCheckoutUrl(url) {
  if (!url) return false;
  if (window.self !== window.top) {
    const tab = window.open(url, '_blank');
    if (!tab) return false;
    tab.opener = null;
    return true;
  }
  window.location.assign(url);
  return true;
}

// Crée la session de paiement puis redirige vers Stripe.
// L'onglet est ouvert dès le clic (avant tout appel réseau) pour ne pas être
// bloqué par le navigateur, puis remplacé par la page Stripe sécurisée.
export async function startStripeCheckout(createSession) {
  const isFramed = window.self !== window.top;
  const tab = isFramed ? window.open('', '_blank') : null;
  if (tab) {
    tab.opener = null;
    try {
      tab.document.write(
        '<p style="font-family:system-ui,sans-serif;padding:28px;font-size:15px">Redirection vers le paiement sécurisé Stripe…</p>',
      );
      tab.document.close();
    } catch {
      /* onglet inaccessible : la redirection ci-dessous reste tentée */
    }
  }

  try {
    const result = await createSession();
    // Aucune redirection nécessaire (ex. abonnement existant mis à jour au prorata).
    if (!result?.url) {
      tab?.close();
      return result;
    }
    if (tab) {
      tab.location.replace(result.url);
      return result;
    }
    // Onglet bloqué alors que l'app tourne dans un aperçu : on remonte l'URL
    // pour afficher un lien de paiement direct à l'utilisateur.
    if (isFramed) return { ...result, manual: true };
    window.location.assign(result.url);
    return result;
  } catch (error) {
    tab?.close();
    throw error;
  }
}