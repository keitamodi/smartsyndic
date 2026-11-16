/**
 * Invitations d'accès aux espaces copropriétaire, propriétaire et technicien.
 * Seul le syndic peut ouvrir un accès : il envoie un lien personnel par email.
 */
export const INVITE_KINDS: Record<string, string> = {
  coproprietaire: 'Copropriétaire',
  proprietaire: 'Propriétaire bailleur',
  technicien: 'Technicien / prestataire',
};

export const SITE_URL = 'https://syndic-vibe-pro.base44.app';
export const INVITE_DAYS = 30;

export const normalizeEmail = (value: any) => String(value || '').trim().toLowerCase();

export const today = () => new Date().toISOString().slice(0, 10);

export function inviteExpiry(days = INVITE_DAYS) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function inviteLink(token: string) {
  return `${SITE_URL}/register?invite=${encodeURIComponent(String(token || ''))}`;
}

export function isExpired(invite: any) {
  if (!invite?.expires_at) return false;
  return String(invite.expires_at).slice(0, 10) < today();
}

const lotNumberList = (value: any) =>
  String(value || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

/**
 * Crée ou rattache la fiche du membre (résident ou prestataire) à son compte.
 */
export async function applyInvite(base44: any, invite: any, accountName: string) {
  const service = base44.asServiceRole.entities;
  const email = normalizeEmail(invite.email);
  const name = String(invite.full_name || accountName || email).trim();

  if (invite.kind === 'technicien') {
    const found = await service.Provider.filter({ syndic_id: invite.syndic_id, email }, { limit: 1 });
    if (!(found.items || []).length) {
      await service.Provider.create({
        syndic_id: invite.syndic_id,
        name,
        contact_name: name,
        email,
        kind: 'prestataire_externe',
        status: 'actif',
      });
    }
    return { kind: 'technicien', redirect: '/mes-interventions' };
  }

  const residentKind = invite.kind === 'proprietaire' ? 'proprietaire_bailleur' : 'coproprietaire';
  const found = await service.Resident.filter({ syndic_id: invite.syndic_id, email }, { limit: 1 });
  let resident = (found.items || [])[0];

  if (!resident) {
    resident = await service.Resident.create({
      syndic_id: invite.syndic_id,
      building_id: invite.building_id || '',
      full_name: name,
      email,
      kind: residentKind,
      lot_numbers: invite.lot_numbers || '',
      status: 'actif',
      access_invited: true,
    });
  } else {
    await service.Resident.update(resident.id, { access_invited: true, status: 'actif' });
  }

  if (invite.building_id) {
    const lotsPage = await service.Lot.filter(
      { syndic_id: invite.syndic_id, building_id: invite.building_id },
      { limit: 200 },
    );
    const wanted = lotNumberList(invite.lot_numbers);
    const targets = (lotsPage.items || []).filter(
      (lot: any) => !wanted.length || wanted.includes(String(lot.number || '').trim().toLowerCase()),
    );
    await Promise.all(
      targets.slice(0, 20).map((lot: any) =>
        service.Lot.update(lot.id, {
          resident_id: resident.id,
          owner_email: normalizeEmail(lot.owner_email) || email,
          owner_name: lot.owner_name || resident.full_name || name,
        }),
      ),
    );
  }

  return { kind: 'resident', redirect: '/mon-espace' };
}

export async function resolveMemberKind(base44: any, user: any) {
  const service = base44.asServiceRole.entities;
  const email = normalizeEmail(user?.email);
  if (!email) return null;

  const [providers, residents, lots] = await Promise.all([
    service.Provider.filter({ email }, { limit: 1 }),
    service.Resident.filter({ email }, { limit: 1 }),
    service.Lot.filter({ owner_email: email }, { limit: 1 }),
  ]);

  if ((providers.items || []).length) return 'technicien';
  if ((residents.items || []).length || (lots.items || []).length) return 'resident';
  return null;
}