/**
 * Invitations d'accès aux espaces copropriétaire, propriétaire, locataire et technicien.
 * Seul le syndic ouvre un accès : il transmet un lien personnel par email, SMS ou WhatsApp.
 */
export const INVITE_KINDS: Record<string, string> = {
  coproprietaire: 'Copropriétaire',
  proprietaire: 'Propriétaire bailleur',
  locataire: 'Locataire / occupant',
  technicien: 'Technicien / prestataire',
};

const RESIDENT_KIND: Record<string, string> = {
  coproprietaire: 'coproprietaire',
  proprietaire: 'proprietaire_bailleur',
  locataire: 'occupant',
};

export const SITE_URL = 'https://syndic-vibe-pro.base44.app';
export const INVITE_DAYS = 30;
export const INVITE_CHANNELS = ['email', 'sms', 'whatsapp'];

export const normalizeEmail = (value: any) => String(value || '').trim().toLowerCase();

export const normalizePhone = (value: any) => {
  const cleaned = String(value || '').replace(/[^\d+]/g, '');
  return cleaned.startsWith('+') ? `+${cleaned.slice(1).replace(/\+/g, '')}` : cleaned.replace(/\+/g, '');
};

export const isPhone = (value: any) => normalizePhone(value).replace(/\D/g, '').length >= 9;

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
 * La fiche d'origine est prioritaire : elle porte l'immeuble, les lots et les interventions.
 */
export async function applyInvite(base44: any, invite: any, accountName: string, accountEmail: string) {
  const service = base44.asServiceRole.entities;
  const email = normalizeEmail(accountEmail || invite.email);
  const phone = normalizePhone(invite.phone);
  const name = String(invite.full_name || accountName || email).trim();

  if (invite.kind === 'technicien' || invite.member_type === 'provider') {
    let provider = null;
    if (invite.member_id) {
      provider = await service.Provider.get(invite.member_id).catch(() => null);
    }
    if (!provider) {
      const found = await service.Provider.filter({ syndic_id: invite.syndic_id, email }, { limit: 1 });
      provider = (found.items || [])[0] || null;
    }

    if (provider) {
      await service.Provider.update(provider.id, {
        email,
        phone: provider.phone || invite.phone || '',
        status: 'actif',
      });
    } else {
      await service.Provider.create({
        syndic_id: invite.syndic_id,
        name,
        contact_name: name,
        email,
        phone: invite.phone || '',
        kind: 'prestataire_externe',
        status: 'actif',
      });
    }
    return { kind: 'technicien', redirect: '/mes-interventions' };
  }

  const residentKind = RESIDENT_KIND[invite.kind] || 'coproprietaire';
  let resident = null;

  if (invite.member_id && invite.member_type !== 'provider') {
    resident = await service.Resident.get(invite.member_id).catch(() => null);
  }
  if (!resident) {
    const found = await service.Resident.filter({ syndic_id: invite.syndic_id, email }, { limit: 1 });
    resident = (found.items || [])[0] || null;
  }
  if (!resident && phone) {
    const all = await service.Resident.filter({ syndic_id: invite.syndic_id }, { limit: 300 });
    resident = (all.items || []).find((row: any) => normalizePhone(row.phone) === phone) || null;
  }

  if (resident) {
    const patch: Record<string, any> = { access_invited: true, status: 'actif', email };
    if (!resident.phone && invite.phone) patch.phone = invite.phone;
    if (!resident.building_id && invite.building_id) patch.building_id = invite.building_id;
    if (!resident.lot_numbers && invite.lot_numbers) patch.lot_numbers = invite.lot_numbers;
    await service.Resident.update(resident.id, patch);
  } else {
    resident = await service.Resident.create({
      syndic_id: invite.syndic_id,
      building_id: invite.building_id || '',
      full_name: name,
      email,
      phone: invite.phone || '',
      kind: residentKind,
      lot_numbers: invite.lot_numbers || '',
      status: 'actif',
      access_invited: true,
    });
  }

  if (invite.building_id) {
    const lotsPage = await service.Lot.filter(
      { syndic_id: invite.syndic_id, building_id: invite.building_id },
      { limit: 200 },
    );
    const wanted = lotNumberList(invite.lot_numbers || resident.lot_numbers);
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

  return { kind: 'resident', resident_id: resident.id, redirect: '/mon-espace' };
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