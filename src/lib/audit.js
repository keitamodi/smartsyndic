import { base44 } from '@/api/base44Client';

export async function logAction({ syndicId, action, entity, entityLabel, details }) {
  try {
    const user = await base44.auth.me().catch(() => null);
    await base44.entities.AuditLog.create({
      syndic_id: syndicId || '',
      actor_email: user?.email || '',
      actor_name: user?.full_name || '',
      action,
      entity,
      entity_label: entityLabel || '',
      details: details || '',
    });
  } catch {
    /* l'historique ne doit jamais bloquer une action métier */
  }
}

export async function notify({ syndicId, recipientEmail, title, message, kind, link }) {
  await base44.entities.Notification.create({
    syndic_id: syndicId || '',
    recipient_email: recipientEmail || '',
    title,
    message: message || '',
    kind: kind || 'systeme',
    read: false,
    link: link || '',
  });
}