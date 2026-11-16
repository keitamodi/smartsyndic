import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const DAY_MS = 86400000;

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

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const syndicId = typeof body?.syndic_id === 'string' ? body.syndic_id : '';
    if (!syndicId) return Response.json({ error: 'syndic_id is required' }, { status: 400 });

    const syndic = await base44.entities.Syndic
      .get(syndicId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!syndic) return Response.json({ error: 'Not found' }, { status: 404 });

    const { items } = await base44.entities.Intervention.filter({ syndic_id: syndicId }, { limit: 500 });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const syndicEmail = syndic.contact_email || '';

    const notifications = [];
    const updates = [];

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
        notifications.push({
          syndic_id: syndicId,
          recipient_email: recipient,
          title: `Intervention en retard : ${item.title}`,
          message: `${place}prévue le ${frenchDate(due)} à ${time}. Replanifiez ou clôturez cette intervention.`,
          kind: 'intervention',
          read: false,
          link: '/maintenance',
        });
        updates.push({ id: item.id, late_alert_sent: true });
        continue;
      }

      if (days > lead || item.reminder_sent) continue;

      const when = days === 0 ? "aujourd'hui" : days === 1 ? 'demain' : `dans ${days} jours`;
      notifications.push({
        syndic_id: syndicId,
        recipient_email: recipient,
        title: `${isRepair ? 'Dépannage' : 'Entretien'} ${when} : ${item.title}`,
        message: `${place}${frenchDate(due)} à ${time}${provider}. ${item.priority === 'urgente' ? 'Priorité urgente.' : ''}`.trim(),
        kind: 'intervention',
        read: false,
        link: '/maintenance',
      });
      updates.push({ id: item.id, reminder_sent: true });
    }

    if (notifications.length > 0) await base44.entities.Notification.bulkCreate(notifications);
    if (updates.length > 0) await base44.entities.Intervention.bulkUpdate(updates);

    return Response.json({ created: notifications.length, checked: items.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}