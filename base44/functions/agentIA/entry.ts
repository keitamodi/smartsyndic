import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const rows = (result) => (Array.isArray(result) ? result : result?.items || []);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const syndicId = typeof body.syndic_id === 'string' ? body.syndic_id : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!syndicId) return Response.json({ error: 'syndic_id est requis.' }, { status: 400 });
    if (!message) return Response.json({ error: 'Le message est vide.' }, { status: 400 });
    if (message.length > 2000) {
      return Response.json({ error: 'Message trop long (2000 caractères maximum).' }, { status: 400 });
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter((item) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
          .slice(-8)
          .map((item) => `${item.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${item.content.slice(0, 1200)}`)
          .join('\n')
      : '';

    const [syndic, buildings, tickets, interventions, contracts, invoices] = await Promise.all([
      base44.entities.Syndic.get(syndicId).catch((error) => (error.status === 404 ? null : Promise.reject(error))),
      base44.entities.Building.filter({ syndic_id: syndicId }, { sort: 'name', limit: 30 }),
      base44.entities.Ticket.filter({ syndic_id: syndicId }, { sort: '-created_date', limit: 30 }),
      base44.entities.Intervention.filter({ syndic_id: syndicId }, { sort: 'scheduled_date', limit: 30 }),
      base44.entities.Contract.filter({ syndic_id: syndicId }, { sort: 'end_date', limit: 30 }),
      base44.entities.Invoice.filter({ syndic_id: syndicId }, { sort: '-created_date', limit: 30 }),
    ]);

    if (!syndic) return Response.json({ error: 'Espace syndic introuvable.' }, { status: 404 });

    const buildingList = rows(buildings);
    const ticketList = rows(tickets);
    const interventionList = rows(interventions);
    const contractList = rows(contracts);
    const invoiceList = rows(invoices);

    const totalCalled = invoiceList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalPaid = invoiceList.reduce((sum, item) => sum + (Number(item.paid_amount) || 0), 0);

    const context = [
      `Espace syndic : ${syndic.name}${syndic.city ? ` (${syndic.city})` : ''}`,
      `Immeubles (${buildingList.length}) : ${buildingList
        .map((item) => `${item.name}${item.city ? ` — ${item.city}` : ''}${item.units_count ? `, ${item.units_count} lots` : ''}`)
        .join(' | ') || 'aucun immeuble enregistré'}`,
      `Tickets récents (${ticketList.length}) : ${ticketList
        .map((item) => `#${item.title} [${item.status}/${item.priority}] ${item.building_name || ''}`)
        .join(' | ') || 'aucun ticket'}`,
      `Interventions (${interventionList.length}) : ${interventionList
        .map((item) => `${item.title} [${item.status}] ${item.scheduled_date || 'date à définir'}`)
        .join(' | ') || 'aucune intervention'}`,
      `Contrats (${contractList.length}) : ${contractList
        .map((item) => `${item.title} [${item.status}] fin ${item.end_date || 'non précisée'}`)
        .join(' | ') || 'aucun contrat'}`,
      `Facturation sur les derniers documents : ${totalCalled.toFixed(2)} € appelés, ${totalPaid.toFixed(2)} € encaissés (${invoiceList.length} documents)`,
    ].join('\n');

    const prompt = `Tu es l'Agent IA de SyndicVibe, plateforme française de gestion de copropriété. Tu assistes un syndic professionnel, bénévole ou coopératif.
Réponds toujours en français, avec un ton professionnel, précis et concis. Structure ta réponse si elle dépasse quelques phrases.
Tu peux t'appuyer uniquement sur le contexte de données ci-dessous. Si une information n'y figure pas, indique-le clairement et propose la démarche à suivre plutôt que d'inventer des chiffres.
Tu peux rédiger des courriers, comptes rendus ou convocations à partir de ce contexte.
Tu n'as pas accès à internet et tu ne peux pas envoyer d'email ni modifier les données : précise-le si on te le demande.

CONTEXTE DE L'ESPACE SYNDIC
${context}

${history ? `HISTORIQUE RÉCENT\n${history}\n` : ''}
QUESTION
${message}`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const answer = typeof response === 'string' ? response : response?.response || '';

    if (!answer) return Response.json({ error: "L'assistant n'a pas renvoyé de réponse." }, { status: 502 });

    return Response.json({ answer });
  } catch (error) {
    return Response.json({ error: error.message || 'Erreur inattendue.' }, { status: 500 });
  }
}