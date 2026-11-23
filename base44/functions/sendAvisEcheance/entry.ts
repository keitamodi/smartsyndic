import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { userBelongsToSyndic } from '../../shared/workspaceAccess.ts';
import { firstName, formatEuro, frenchDate, sendTemplateEmails } from '../../shared/notifyEmail.ts';

const MAX_INVOICES = 200;

function rows(page: any) {
  return Array.isArray(page) ? page : page?.items || [];
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const syndicId = String(body?.syndic_id || '').trim();
    const invoiceIds = Array.isArray(body?.invoice_ids)
      ? body.invoice_ids.map((id: any) => String(id)).filter(Boolean).slice(0, MAX_INVOICES)
      : [];

    if (!syndicId || invoiceIds.length === 0) {
      return Response.json({ error: "Aucun avis d'échéance à envoyer." }, { status: 400 });
    }
    if (!(await userBelongsToSyndic(base44, user, syndicId))) {
      return Response.json({ error: 'Accès refusé à cet espace syndic.' }, { status: 403 });
    }

    const db = base44.asServiceRole.entities;
    const syndic = await db.Syndic.get(syndicId).catch((e: any) => (e.status === 404 ? null : Promise.reject(e)));
    const fromName = syndic?.name || 'Votre syndic';

    const invoices = rows(
      await db.Invoice.filter({ syndic_id: syndicId, id: { $in: invoiceIds } }, { limit: MAX_INVOICES }),
    );
    if (invoices.length === 0) {
      return Response.json({ error: 'Avis d’échéance introuvables.' }, { status: 404 });
    }

    const buildingIds = [...new Set(invoices.map((invoice: any) => invoice.building_id).filter(Boolean))];
    const lotPages = await Promise.all(
      buildingIds
        .slice(0, 6)
        .map((buildingId: string) => db.Lot.filter({ syndic_id: syndicId, building_id: buildingId }, { limit: 500 })),
    );

    const lotInfo = new Map();
    for (const page of lotPages) {
      for (const lot of rows(page)) {
        if (lot.building_id && lot.number) {
          lotInfo.set(`${lot.building_id}::${lot.number}`, {
            email: lot.owner_email || '',
            name: lot.owner_name || '',
          });
        }
      }
    }

    const tasks: any[] = [];
    const notifications: any[] = [];
    const skipped: string[] = [];

    for (const invoice of invoices) {
      const lot = lotInfo.get(`${invoice.building_id}::${invoice.lot_number}`) || { email: '', name: '' };
      const email = String(invoice.recipient_email || lot.email || '').trim();
      if (!email) {
        skipped.push(invoice.reference || invoice.id);
        continue;
      }

      const amount = Number(invoice.amount) || 0;
      const arrears = Number(invoice.arrears_amount) || 0;
      const due = frenchDate(invoice.due_date);

      tasks.push({
        to: email,
        template: 'AvisEcheance',
        fromName,
        variables: {
          first_name: firstName(lot.name),
          building_name: invoice.building_name || 'votre immeuble',
          lot_number: invoice.lot_number || 'non précisé',
          reference: invoice.reference || '',
          period: invoice.period || '',
          amount: formatEuro(amount),
          breakdown:
            arrears > 0
              ? `Dont ${formatEuro(arrears)} d'arriérés repris dans cet appel de fonds.`
              : "Aucun arriéré n'est repris dans cet appel de fonds.",
          due_date: due,
          syndic_name: fromName,
        },
      });

      notifications.push({
        syndic_id: syndicId,
        recipient_email: email,
        title: `Appel de fonds ${invoice.reference || ''} · ${invoice.period || ''}`.trim(),
        message: `${formatEuro(amount)} à régler avant le ${due}. Un rappel automatique partira en cas de non-paiement.`,
        kind: 'facture',
        read: false,
        link: '/mon-espace',
      });
    }

    const { sent, failed } = await sendTemplateEmails(base44, tasks);

    if (notifications.length > 0) await db.Notification.bulkCreate(notifications);
    await db.Invoice.bulkUpdate(invoices.map((invoice: any) => ({ id: invoice.id, status: 'envoyee' })));

    return Response.json({
      total: invoices.length,
      sent,
      failed: failed.length,
      skipped: skipped.length,
      failures: failed.slice(0, 5).map((item: any) => item.to),
      failure_reason: failed[0]?.reason || '',
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}