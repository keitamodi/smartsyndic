export const TEAM_ROLE_META = {
  administrateur: {
    label: 'Administrateur du syndic',
    description: 'Accès complet : finances, paramètres, équipe et abonnement.',
  },
  directeur: {
    label: 'Directeur',
    description: 'Pilote tous les immeubles et valide les décisions du cabinet.',
  },
  gestionnaire: {
    label: 'Gestionnaire de copropriété',
    description: 'Gère au quotidien les immeubles de son périmètre.',
  },
  assistant: {
    label: 'Assistant de gestion',
    description: 'Traite les demandes, les interventions et la messagerie.',
  },
  comptable: {
    label: 'Comptable',
    description: 'Appels de fonds, relances et suivi des paiements.',
  },
};

export const TEAM_ROLE_OPTIONS = Object.entries(TEAM_ROLE_META).map(([value, meta]) => ({
  value,
  ...meta,
}));

export const roleLabel = (role) => TEAM_ROLE_META[role]?.label || 'Collaborateur';

export const roleDescription = (role) => TEAM_ROLE_META[role]?.description || '';

export const TEAM_STATUS_HINT = {
  actif: 'Accès activé',
  invite: 'Email envoyé, en attente d’activation',
  desactive: 'Accès suspendu',
};