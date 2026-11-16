export const INVITE_KINDS = {
  coproprietaire: 'Copropriétaire',
  proprietaire: 'Propriétaire bailleur',
  locataire: 'Locataire / occupant',
  technicien: 'Technicien / prestataire',
};

export const inviteKindLabel = (kind) => INVITE_KINDS[kind] || 'Membre';

/** Profil d'invitation correspondant au profil de la fiche résident. */
export const inviteKindFromResident = (kind) => {
  if (kind === 'proprietaire_bailleur') return 'proprietaire';
  if (kind === 'occupant') return 'locataire';
  return 'coproprietaire';
};