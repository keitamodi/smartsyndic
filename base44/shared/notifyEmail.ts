/**
 * Envoi des emails de gestion aux copropriétaires.
 * Toutes les fonctions passent par ce module pour garder les mêmes
 * formats, la même catégorie transactionnelle et les mêmes garde-fous.
 */

export function formatEuro(value: any) {
  return `${(Math.round((Number(value) || 0) * 100) / 100).toFixed(2).replace('.', ',')} €`;
}

export function frenchDate(value: any) {
  const [year, month, day] = String(value || '')
    .slice(0, 10)
    .split('-')
    .map(Number);
  if (!year || !month || !day) return 'date à confirmer';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, day),
  );
}

export function firstName(value: any) {
  const clean = String(value || '').trim();
  if (!clean) return 'cher copropriétaire';
  return clean.split(/\s+/)[0];
}

export async function sendTemplateEmail(base44: any, item: any) {
  try {
    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      to: item.to,
      template_name: item.template,
      category: 'transactional',
      from_name: item.fromName || 'Votre syndic',
      variables: item.variables || {},
    });
    if (result?.success === false) {
      return { ok: false, reason: result.reason || result.message || 'envoi refusé' };
    }
    return { ok: true, reason: '' };
  } catch (error: any) {
    return { ok: false, reason: error?.message || 'envoi impossible' };
  }
}

/** Envoie par lots de 6 pour rester dans les limites du worker. */
export async function sendTemplateEmails(base44: any, items: any[]) {
  let sent = 0;
  const failed: any[] = [];
  for (let index = 0; index < items.length; index += 6) {
    const batch = items.slice(index, index + 6);
    const results = await Promise.allSettled(batch.map((item) => sendTemplateEmail(base44, item)));
    results.forEach((result: any, position: number) => {
      if (result.status === 'fulfilled' && result.value?.ok) sent += 1;
      else {
        const reason = result.status === 'fulfilled' ? result.value?.reason : result.reason?.message;
        failed.push({ ...batch[position], reason: reason || 'envoi impossible' });
      }
    });
  }
  return { sent, failed };
}