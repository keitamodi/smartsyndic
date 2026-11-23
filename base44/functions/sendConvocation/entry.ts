import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { userBelongsToSyndic } from '../../shared/workspaceAccess.ts';
import { firstName, frenchDate, sendTemplateEmails } from '../../shared/notifyEmail.ts';

const MAX_RECIPIENTS = 300;

function rows(page: any) {
  return Array.isArray(page) ? page : page?.items || [];
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const syndicId = String(body?.syndic_id || '').trim();
    const assemblyId = String(body?.assembly_id || '').trim();
    if (!syndicId || !assemblyId) {
      return Response.json({ error: 'Assemblée introuvable.' }, { status: 400 });
    }
    if (!(await userBelongsToSyndic(base44, user, syndicId))) {
      return Response.json({ error: 'Accès refusé à cet espace syndic.' }, { status: 403 });
    }

    const db = base44.asServiceRole.entities;
    const assembly = await db.Assembly.get(assemblyId).catch((e: any) => (e.status === 404 ? null : Promise.reject(e)));
    if (!assembly || String(assembly.syndic_id || '') !== syndicId) {
      return Response.json({ error: 'Assemblée introuvable.' }, { status: 404 });
    }

    const [syndic, building, residentPage, lotPage] = await Promise.all([
      db.Syndic.get(syndicId).catch((e: any) => (e.status === 404 ? null : Promise.reject(e))),
      assembly.building_id
        ? db.Building.get(assembly.building_id).catch((e: any) => (e.status === 404 ? null : Promise.reject(e)))
        : null,
      assembly.building_id
        ? db.Resident.filter({ syndic_id: syndicId, building_id: assembly.building_id }, { limit: 500 })
        : [],
      assembly.building_id
        ? db.Lot.filter({ syndic_id: syndicId, building_id: assembly.building_id }, { limit: 500 })
        : [],
    ]);

    const fromName = syndic?.name || 'Votre syndic';
    const recipients = new Map();
    for (const resident of rows(residentPage)) {
      if (resident.status === 'sorti') continue;
      if (!['coproprietaire', 'proprietaire_bailleur'].includes(resident.kind)) continue;
      const email = String(resident.email || '').trim();
      if (email) recipients.set(email.toLowerCase(), { email, name: resident.full_name || '' });
    }
    for (const lot of rows(lotPage)) {
      const email = String(lot.owner_email || '').trim();
      if (email && !recipients.has(email.toLowerCase())) {
        recipients.set(email.toLowerCase(), { email, name: lot.owner_name || '' });
      }
    }

    const audience = [...recipients.values()].slice(0, MAX_RECIPIENTS);
    const agendaLines = String(assembly.agenda || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 12);

    const shared = {
      building_name: building?.name || 'votre immeuble',
      assembly_title: assembly.title || 'Assemblée générale',
      assembly_kind: assembly.kind === 'extraordinaire' ? 'l’assemblée générale extraordinaire' : 'l’assemblée générale ordinaire',
      assembly_date: frenchDate(assembly.date),
      assembly_time: assembly.time || 'heure à confirmer',
      assembly_location: assembly.location || 'lieu à confirmer',
      agenda: agendaLines.length ? agendaLines.join(' · ') : 'Ordre du jour disponible dans votre espace.',
      syndic_name: fromName,
    };

    const tasks = audience.map((person: any) => ({
      to: person.email,
      template: 'ConvocationAG',
      fromName,
      variables: { ...shared, first_name: firstName(person.name) },
    }));

    const { sent, failed } = await sendTemplateEmails(base44, tasks);

    if (audience.length > 0) {
      await db.Notification.bulkCreate(
        audience.map((person: any) => ({
          syndic_id: syndicId,
          recipient_email: person.email,
          title: `Convocation : ${assembly.title}`,
          message: `Vous êtes convoqué(e) le ${frenchDate(assembly.date)} à ${assembly.time || 'l’heure indiquée'} · ${
            assembly.location || 'lieu à confirmer'
          }.`,
          kind: 'assemblee',
          read: false,
          link: '/mon-espace',
        })),
      );
    }

    await db.Assembly.update(assemblyId, {
      convocation_sent: true,
      convoked_at: todayIso(),
      status: assembly.status === 'preparation' ? 'convoquee' : assembly.status,
    });

    return Response.json({
      recipients: audience.length,
      sent,
      failed: failed.length,
      notifications: audience.length,
      failures: failed.slice(0, 5).map((item: any) => item.to),
      failure_reason: failed[0]?.reason || '',
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}