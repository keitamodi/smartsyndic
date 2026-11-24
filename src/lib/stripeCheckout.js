// Ouvre la page de paiement Stripe. Le paiement ne peut jamais s'afficher dans une
// iframe (aperçu intégré) : on ouvre donc un onglet, et si le navigateur le bloque
// on fait naviguer la fenêtre supérieure.
// Retourne false quand aucune ouverture n'a pu être déclenchée (l'appelant propose
// alors le lien direct).
function navigateTo(url) {
  try {
    if (window.self !== window.top) {
      window.top.location.href = url;
    } else {
      window.location.assign(url);
    }
    return true;
  } catch {
    try {
      window.location.assign(url);
      return true;
    } catch {
      return false;
    }
  }
}

export function openCheckoutUrl(url) {
  if (!url) return false;
  if (window.self === window.top) {
    window.location.assign(url);
    return true;
  }
  const tab = window.open(url, '_blank');
  if (tab) {
    try {
      tab.opener = null;
      tab.focus();
    } catch {
      /* onglet déjà chargé : rien à faire */
    }
    return true;
  }
  return navigateTo(url);
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
      tab.focus();
      return result;
    }
    if (isFramed) {
      // Onglet bloqué dans l'aperçu : on ouvre Stripe en pleine page.
      if (navigateTo(result.url)) return result;
      return { ...result, manual: true };
    }
    window.location.assign(result.url);
    return result;
  } catch (error) {
    tab?.close();
    throw error;
  }
}