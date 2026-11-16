import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { userBelongsToSyndic } from '../../shared/workspaceAccess.ts';
import {
  INVITE_CHANNELS,
  INVITE_DAYS,
  INVITE_KINDS,
  inviteExpiry,
  inviteLink,
  isPhone,
  normalizeEmail,
  normalizePhone,
  today,
} from '../../shared/memberInvite.ts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const syndicId = String(body.syndic_id || '').trim();
    const kind = String(body.kind || '').trim();
    const channel = INVITE_CHANNELS.includes(String(body.channel)) ? String(body.channel) : 'email';
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);

    if (!syndicId || !INVITE_KINDS[kind]) {
      return Response.json(
        { error: "Invitation incomplète : choisissez le profil de la personne." },
        { status: 400 },
      );
    }

    if (channel === 'email' && !EMAIL_RE.test(email)) {
      return Response.json({ error: 'Renseignez une adresse email valide.' }, { status: 400 });
    }

    if (channel !== 'email' && !isPhone(phone)) {
      return Response.json({ error: 'Renseignez un numéro de téléphone valide.' }, { status: 400 });
    }

    if (!(await userBelongsToSyndic(base44, user, syndicId))) {
      return Response.json({ error: 'Accès refusé à cet espace syndic.' }, { status: 403 });
    }

    const service = base44.asServiceRole.entities;
    const syndic = await service.Syndic.get(syndicId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    const syndicName = syndic?.name || 'Votre syndic';

    const existingQuery = channel === 'email' ? { syndic_id: syndicId, email } : { syndic_id: syndicId, phone };
    const existing = await service.MemberInvite.filter({ ...existingQuery, status: 'en_attente' }, { limit: 1 });
    const previous = (existing.items || [])[0];
    const token = previous?.token || crypto.randomUUID();

    const payload = {
      syndic_id: syndicId,
      email,
      phone,
      channel,
      full_name: String(body.full_name || '').trim(),
      kind,
      member_id: String(body.member_id || '').trim(),
      member_type: ['resident', 'provider'].includes(String(body.member_type))
        ? String(body.member_type)
        : kind === 'technicien'
          ? 'provider'
          : 'resident',
      building_id: String(body.building_id || '').trim(),
      building_name: String(body.building_name || '').trim(),
      lot_numbers: String(body.lot_numbers || '').trim(),
      invited_by: user.email || '',
      token,
      status: 'en_attente',
      expires_at: inviteExpiry(INVITE_DAYS),
      sent_at: today(),
      accepted_at: '',
    };

    const invite = previous
      ? await service.MemberInvite.update(previous.id, payload)
      : await service.MemberInvite.create(payload);

    const link = inviteLink(token);
    let emailSent = false;
    let warning = '';

    // Le lien part par email : message de marque. Par téléphone, il est transmis par SMS ou WhatsApp.
    if (channel === 'email') {
      try {
        const sent = await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          template_name: 'MemberInvite',
          category: 'transactional',
          from_name: syndicName,
          variables: {
            full_name: payload.full_name || email,
            kind_label: INVITE_KINDS[kind],
            building_name: payload.building_name || 'votre immeuble',
            lot_numbers: payload.lot_numbers || 'non précisés',
            syndic_name: syndicName,
            invite_url: link,
            expires_days: String(INVITE_DAYS),
          },
        });
        if (sent?.success === false) throw new Error(sent.reason || 'envoi refusé');
        emailSent = true;
      } catch {
        try {
          await base44.users.inviteUser(email, 'user');
          warning =
            "L'email personnalisé n'a pas pu être envoyé : une invitation standard a été transmise. Vous pouvez aussi copier le lien ci-dessous.";
        } catch {
          warning = "L'email n'a pas pu être envoyé automatiquement : transmettez le lien ci-dessous à la personne.";
        }
      }
    }

    return Response.json({
      invite_id: invite.id,
      link,
      channel,
      email,
      phone,
      email_sent: emailSent,
      warning,
      expires_at: payload.expires_at,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}