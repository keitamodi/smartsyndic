export const INVITE_KINDS = {
  coproprietaire: 'Copropriétaire',
  proprietaire: 'Propriétaire bailleur',
  technicien: 'Technicien / prestataire',
};

export const inviteKindLabel = (kind) => INVITE_KINDS[kind] || 'Membre';