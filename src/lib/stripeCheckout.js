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
    const { url } = await createSession();
    if (!url) throw new Error('Session de paiement indisponible.');
    if (checkoutTab) {
      checkoutTab.location.replace(url);
    } else {
      window.location.assign(url);
    }
  } catch (error) {
    checkoutTab?.close();
    throw error;
  }
}