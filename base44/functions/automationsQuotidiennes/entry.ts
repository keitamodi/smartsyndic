import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const DAY_MS = 86400000;
const AUTOMATION_EMAIL = 'automations@smartsyndic.app';
const AUTOMATION_NAME = 'Automatisation';
const REMINDER_LABELS = ['Rappel amiable', 'Relance écrite', 'Mise en demeure', 'Recouvrement contentieux'];
const SCOPES = ['interventions', 'impayes', 'assemblees'];

function parseDate(value) {
  const [year, month, day] = String(value || '')
    .slice(0, 10)
    .split('-')
    .map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function frenchDate(date) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isoDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function euro(value) {
  return `${(Math.round(value * 100) / 100).toFixed(2).replace('.', ',')} €`;
}

function outstandingOf(invoice) {
  return Math.max((Number(invoice?.amount) || 0) - (Number(invoice?.paid_amount) || 0), 0);
}

function isOpen(invoice) {
  return Boolean(invoice) && invoice.status !== 'brouillon' && invoice.status !== 'payee' && outstandingOf(invoice) > 0;
}

function rows(page) {
  if (Array.isArray(page)) return page;
  return page?.items || [];
}

function interventionReminders(syndic, items, today) {
  const notifications = [];
  const updates = [];
  const syndicEmail = syndic.contact_email || '';

  for (const item of items) {
    if (!item.scheduled_date) continue;
    if (item.status === 'terminee' || item.status === 'annulee') continue;
    const due = parseDate(item.scheduled_date);
    if (!due) continue;

    const days = Math.round((due.getTime() - today.getTime()) / DAY_MS);
    const lead = Number.isFinite(Number(item.reminder_days)) && item.reminder_days !== null
      ? Number(item.reminder_days)
      : 7;
    const time = item.scheduled_time || '09:00';
    const isRepair = item.origin === 'depannage';
    const recipient = isRepair ? item.contact_email || syndicEmail : syndicEmail;
    const place = item.building_name ? `${item.building_name} — ` : '';
    const provider = item.provider_name ? ` avec ${item.provider_name}` : '';

    if (days < 0) {
      if (item.late_alert_sent) continue;
      if (recipient) {
        notifications.push({
          syndic_id: syndic.id,
          recipient_email: recipient,
          title: `Intervention en retard : ${item.title}`,
          message: `${place}prévue le ${frenchDate(due)} à ${time}. Replanifiez ou clôturez cette intervention.`,
          kind: 'intervention',
          read: false,
          link: '/maintenance',
        });
      }
      updates.push({ id: item.id, late_alert_sent: true });
      continue;
    }

    if (days > lead || item.reminder_sent) continue;

    const when = days === 0 ? "aujourd'hui" : days === 1 ? 'demain' : `dans ${days} jours`;
    if (recipient) {
      notifications.push({
        syndic_id: syndic.id,
        recipient_email: recipient,
        title: `${isRepair ? 'Dépannage' : 'Entretien'} ${when} : ${item.title}`,
        message: `${place}${frenchDate(due)} à ${time}${provider}. ${item.priority === 'urgente' ? 'Priorité urgente.' : ''}`.trim(),
        kind: 'intervention',
        read: false,
        link: '/maintenance',
      });
    }
    updates.push({ id: item.id, reminder_sent: true });
  }

  return { notifications, updates };
}

function invoiceReminders(syndic, invoices, lots, today) {
  const lotEmails = new Map();
  for (const lot of lots) {
    if (lot.building_id && lot.number && lot.owner_email) {
      lotEmails.set(`${lot.building_id}::${lot.number}`, lot.owner_email);
    }
  }

  const notifications = [];
  const updates = [];

  for (const invoice of invoices) {
    if (!isOpen(invoice)) continue;
    const due = parseDate(invoice.due_date);
    if (!due) continue;

    const late = Math.round((today.getTime() - due.getTime()) / DAY_MS);
    if (late <= 0) continue;

    const cadence = Math.max(Number(invoice.reminder_days) || 7, 1);
    const level = Math.min(Math.max(Number(invoice.reminder_level) || 0, 0), 3);
    if (late < cadence * (level + 1)) continue;
    if (level >= 3 && invoice.last_reminder_at) continue;

    const last = parseDate(invoice.last_reminder_at);
    if (last && Math.round((today.getTime() - last.getTime()) / DAY_MS) < cadence) continue;

    const email = invoice.recipient_email || lotEmails.get(`${invoice.building_id}::${invoice.lot_number}`) || '';
    const stage = REMINDER_LABELS[level];
    const closing = {
      0: "Merci de régulariser rapidement pour garantir la continuité des services de l'immeuble.",
      1: 'Sans règlement sous 8 jours, une mise en demeure vous sera adressée.',
      2: 'À défaut de règlement sous 15 jours, le dossier sera transmis au service de recouvrement.',
      3: 'Le dossier est transmis au recouvrement contentieux.',
    };

    if (email) {
      notifications.push({
        syndic_id: syndic.id,
        recipient_email: email,
        title: `${stage} — ${invoice.reference || 'appel de fonds'}`,
        message: `${euro(outstandingOf(invoice))} restent dus au titre de l'échéance du ${frenchDate(due)} (${late} jour(s) de retard). ${closing[level] || ''}`.trim(),
        kind: 'facture',
        read: false,
        link: '/mon-espace',
      });
    }

    updates.push({
      id: invoice.id,
      reminder_level: Math.min(level + 1, 3),
      last_reminder_at: isoDay(today),
      status: 'en_retard',
      ...(email && !invoice.recipient_email ? { recipient_email: email } : {}),
    });
  }

  return { notifications, updates };
}

function assemblyAlerts(syndic, assemblies, today) {
  const notifications = [];
  const updates = [];
  const recipient = syndic.contact_email || '';

  for (const assembly of assemblies) {
    if (!assembly.date) continue;
    if (['cloturee', 'annulee', 'en_cours'].includes(assembly.status)) continue;
    if (assembly.convocation_sent || assembly.convocation_alert_sent) continue;

    const at = parseDate(assembly.date);
    if (!at) continue;
    const days = Math.round((at.getTime() - today.getTime()) / DAY_MS);
    if (days < 0 || days > 21) continue;

    if (recipient) {
      notifications.push({
        syndic_id: syndic.id,
        recipient_email: recipient,
        title: `Convocation à envoyer : ${assembly.title}`,
        message: `L'assemblée du ${frenchDate(at)} a lieu ${days === 0 ? "aujourd'hui" : `dans ${days} jour(s)`}. La convocation doit parvenir aux copropriétaires au moins 21 jours avant.`,
        kind: 'assemblee',
        read: false,
        link: '/assemblees',
      });
    }
    updates.push({ id: assembly.id, convocation_alert_sent: true });
  }

  return { notifications, updates };
}

async function logRun(db, syndicId, action, entity, count) {
  if (count <= 0) return;
  await db.entities.AuditLog.create({
    syndic_id: syndicId,
    actor_email: AUTOMATION_EMAIL,
    actor_name: AUTOMATION_NAME,
    action,
    entity,
    entity_label: `${count} action(s)`,
    details: 'Passage quotidien automatique',
  });
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const requested = typeof body?.scope === 'string' ? body.scope : 'all';
    const scopes = SCOPES.includes(requested) ? [requested] : SCOPES;

    const db = base44.asServiceRole;
    const onlySyndic = typeof body?.syndic_id === 'string' && body.syndic_id ? body.syndic_id : null;
    const allSyndics = rows(await db.entities.Syndic.list());
    const syndics = onlySyndic ? allSyndics.filter((item) => item.id === onlySyndic) : allSyndics;
    const today = startOfToday();
    const summary = { syndics: syndics.length, notifications: 0, interventions: 0, impayes: 0, assemblees: 0 };

    for (const syndic of syndics) {
      const [interventions, invoices, lots, assemblies] = await Promise.all([
        db.entities.Intervention.filter({ syndic_id: syndic.id }, { limit: 500 }),
        db.entities.Invoice.filter({ syndic_id: syndic.id }, { limit: 500 }),
        db.entities.Lot.filter({ syndic_id: syndic.id }, { limit: 500 }),
        db.entities.Assembly.filter({ syndic_id: syndic.id }, { limit: 200 }),
      ]);

      if (scopes.includes('interventions')) {
        const { notifications, updates } = interventionReminders(syndic, rows(interventions), today);
        if (notifications.length > 0) await db.entities.Notification.bulkCreate(notifications);
        if (updates.length > 0) await db.entities.Intervention.bulkUpdate(updates);
        summary.notifications += notifications.length;
        summary.interventions += updates.length;
        await logRun(db, syndic.id, 'Relances interventions', 'Intervention', updates.length);
      }

      if (scopes.includes('impayes')) {
        const { notifications, updates } = invoiceReminders(syndic, rows(invoices), rows(lots), today);
        if (notifications.length > 0) await db.entities.Notification.bulkCreate(notifications);
        if (updates.length > 0) await db.entities.Invoice.bulkUpdate(updates);
        summary.notifications += notifications.length;
        summary.impayes += updates.length;
        await logRun(db, syndic.id, 'Relances impayés', 'Invoice', updates.length);
      }

      if (scopes.includes('assemblees')) {
        const { notifications, updates } = assemblyAlerts(syndic, rows(assemblies), today);
        if (notifications.length > 0) await db.entities.Notification.bulkCreate(notifications);
        if (updates.length > 0) await db.entities.Assembly.bulkUpdate(updates);
        summary.notifications += notifications.length;
        summary.assemblees += updates.length;
        await logRun(db, syndic.id, "Convocations d'AG", 'Assembly', updates.length);
      }
    }

    return Response.json(summary);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}