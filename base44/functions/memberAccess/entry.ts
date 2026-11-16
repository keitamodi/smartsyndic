import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  INVITE_KINDS,
  applyInvite,
  isExpired,
  normalizeEmail,
  resolveMemberKind,
  today,
} from '../../shared/memberInvite.ts';

const redirectFor = (kind: string) => (kind === 'technicien' ? '/mes-interventions' : '/mon-espace');

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '').trim();
    const service = base44.asServiceRole.entities;

    // Vérification publique du lien reçu par email, avant création du compte.
    if (action === 'check') {
      const token = String(body.token || '').trim();
      if (!token) return Response.json({ valid: false, reason: 'introuvable' }, { status: 400 });

      const page = await service.MemberInvite.filter({ token }, { limit: 1 });
      const invite = (page.items || [])[0];
      if (!invite || invite.status === 'annulee') return Response.json({ valid: false, reason: 'introuvable' });
      if (invite.status === 'acceptee') return Response.json({ valid: false, reason: 'deja_utilisee' });
      if (isExpired(invite)) return Response.json({ valid: false, reason: 'expiree' });

      const syndic = await service.Syndic.get(invite.syndic_id).catch((e) =>
        e.status === 404 ? null : Promise.reject(e),
      );

      return Response.json({
        valid: true,
        email: invite.email,
        kind: invite.kind,
        kind_label: INVITE_KINDS[invite.kind] || '',
        full_name: invite.full_name || '',
        building_name: invite.building_name || '',
        lot_numbers: invite.lot_numbers || '',
        syndic_name: syndic?.name || 'votre syndic',
      });
    }

    // Aucune inscription sans autorisation du syndic : l'email doit porter une invitation.
    if (action === 'checkEmail') {
      const target = normalizeEmail(body.email);
      if (!target) return Response.json({ authorized: false }, { status: 400 });
      const page = await service.MemberInvite.filter({ email: target, status: 'en_attente' }, { limit: 5 });
      const authorized = (page.items || []).some((invite: any) => !isExpired(invite));
      return Response.json({ authorized });
    }

    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const email = normalizeEmail(user.email);

    // Activation du compte juste après la vérification de l'email.
    if (action === 'claim') {
      const token = String(body.token || '').trim();
      const page = await service.MemberInvite.filter({ token }, { limit: 1 });
      const invite = (page.items || [])[0];
      if (!invite) return Response.json({ error: 'Invitation introuvable.' }, { status: 404 });
      if (invite.status === 'annulee' || isExpired(invite)) {
        return Response.json({ error: 'Cette invitation a expiré.' }, { status: 410 });
      }
      if (invite.status === 'acceptee') {
        return Response.json({ kind: invite.kind, redirect: redirectFor(invite.kind) });
      }
      if (normalizeEmail(invite.email) !== email) {
        return Response.json(
          { error: "Cette invitation ne correspond pas à l'adresse email de votre compte." },
          { status: 403 },
        );
      }

      const result = await applyInvite(base44, invite, user.full_name);
      await service.MemberInvite.update(invite.id, { status: 'acceptee', accepted_at: today() });
      return Response.json(result);
    }

    // Profil du membre connecté + rattachement automatique d'une invitation en attente.
    if (action === 'whoami') {
      if (user.role === 'admin') return Response.json({ kind: 'admin', email });
      const pending = await service.MemberInvite.filter({ email, status: 'en_attente' }, { limit: 5 });
      for (const invite of pending.items || []) {
        if (isExpired(invite)) continue;
        await applyInvite(base44, invite, user.full_name);
        await service.MemberInvite.update(invite.id, { status: 'acceptee', accepted_at: today() });
      }
      const kind = await resolveMemberKind(base44, user);
      return Response.json({ kind, email });
    }

    return Response.json({ error: 'Action inconnue.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}