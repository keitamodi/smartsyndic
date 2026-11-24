// Ouvre Stripe Checkout en pleine page : nouvel onglet dans l'aperçu (iframe),
// navigation directe une fois l'app publiée.
export async function startStripeCheckout(createSession) {
  const isFramed = window.self !== window.top;
  const checkoutTab = isFramed ? window.open('', '_blank') : null;
  if (isFramed && !checkoutTab) {
    throw new Error('Autorisez les fenêtres pop-up pour continuer vers le paiement.');
  }
  if (checkoutTab) checkoutTab.opener = null;

  try {
    const result = await createSession();
    // Aucune redirection nécessaire (ex. abonnement existant mis à jour au prorata).
    if (!result?.url) {
      checkoutTab?.close();
      return result;
    }
    if (checkoutTab) {
      checkoutTab.location.replace(result.url);
    } else {
      window.location.assign(result.url);
    }
    return result;
  } catch (error) {
    checkoutTab?.close();
    throw error;
  }
}