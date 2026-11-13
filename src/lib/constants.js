export const labels = (map, value) => map?.[value] || value || '—';

export const options = (map) => Object.entries(map).map(([value, label]) => ({ value, label }));

export const SYNDIC_KIND = {
  professionnel: 'Syndic professionnel',
  benevole: 'Syndic bénévole',
  cooperatif: 'Syndic coopératif',
};

export const SYNDIC_STATUS = { actif: 'Actif', essai: 'Essai', suspendu: 'Suspendu' };

export const BUILDING_KIND = { residentiel: 'Résidentiel', mixte: 'Mixte', commercial: 'Commercial' };
export const BUILDING_STATUS = { actif: 'Actif', travaux: 'En travaux', archive: 'Archivé' };

export const LOT_KIND = { appartement: 'Appartement', parking: 'Parking', cave: 'Cave', local: 'Local commercial' };
export const LOT_STATUS = { occupe: 'Occupé', vacant: 'Vacant', travaux: 'Travaux' };
export const LOT_OCCUPANCY = {
  proprietaire_occupant: 'Propriétaire occupant',
  loue: 'Loué',
  vacant: 'Vacant',
};

export const RESIDENT_KIND = {
  coproprietaire: 'Copropriétaire',
  proprietaire_bailleur: 'Propriétaire bailleur',
  occupant: 'Occupant / locataire',
};
export const RESIDENT_STATUS = { actif: 'Actif', sorti: 'Sorti' };

export const TICKET_CATEGORY = {
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  ascenseur: 'Ascenseur',
  chauffage: 'Chauffage',
  toiture: 'Toiture',
  parties_communes: 'Parties communes',
  nuisances: 'Nuisances',
  autre: 'Autre',
};

export const TICKET_PRIORITY = { basse: 'Basse', normale: 'Normale', haute: 'Haute', urgente: 'Urgente' };

export const TICKET_STATUS = {
  nouveau: 'Nouveau',
  qualifie: 'Qualifié',
  en_cours: 'En cours',
  en_attente: 'En attente',
  resolu: 'Résolu',
  clos: 'Clos',
};

export const REQUESTER_KIND = {
  coproprietaire: 'Copropriétaire',
  proprietaire: 'Propriétaire',
  occupant: 'Occupant',
  autre: 'Autre',
};

export const ASSIGNEE_KIND = { technicien: 'Technicien', prestataire: 'Prestataire', interne: 'Équipe interne' };

export const INTERVENTION_KIND = {
  preventive: 'Préventive',
  curative: 'Curative',
  controle: 'Contrôle réglementaire',
};

export const INTERVENTION_STATUS = {
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

export const PROVIDER_KIND = {
  technicien_interne: 'Technicien interne',
  prestataire_externe: 'Prestataire externe',
};

export const PROVIDER_SPECIALTY = {
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  chauffage: 'Chauffage',
  ascenseur: 'Ascenseur',
  toiture: 'Toiture',
  espaces_verts: 'Espaces verts',
  nettoyage: 'Nettoyage',
  securite: 'Sécurité',
  multiservices: 'Multiservices',
};

export const PROVIDER_STATUS = { actif: 'Actif', inactif: 'Inactif' };

export const TEAM_ROLE = {
  administrateur: 'Administrateur du syndic',
  directeur: 'Directeur',
  gestionnaire: 'Gestionnaire de copropriété',
  assistant: 'Assistant de gestion',
  comptable: 'Comptable',
};

export const TEAM_STATUS = { actif: 'Actif', invite: 'Invitation en attente', desactive: 'Désactivé' };

export const CONTRACT_KIND = {
  maintenance: 'Maintenance',
  nettoyage: 'Nettoyage',
  assurance: 'Assurance',
  energie: 'Énergie',
  securite: 'Sécurité',
  autre: 'Autre',
};

export const CONTRACT_RENEWAL = { tacite: 'Tacite reconduction', express: 'Renouvellement exprès', aucune: 'Sans renouvellement' };

export const CONTRACT_STATUS = {
  actif: 'Actif',
  a_renouveler: 'À renouveler',
  echu: 'Échu',
  resilie: 'Résilié',
};

export const DOCUMENT_CATEGORY = {
  assemblee: 'Assemblée générale',
  contrat: 'Contrat',
  assurance: 'Assurance',
  comptabilite: 'Comptabilité',
  technique: 'Technique',
  reglementation: 'Réglementation',
  autre: 'Autre',
};

export const ASSEMBLY_KIND = { ordinaire: 'Assemblée ordinaire', extraordinaire: 'Assemblée extraordinaire' };

export const ASSEMBLY_STATUS = {
  preparation: 'En préparation',
  convoquee: 'Convoquée',
  en_cours: 'En séance',
  cloturee: 'Clôturée',
  annulee: 'Annulée',
};

export const MAJORITY = {
  article_24: 'Article 24',
  article_25: 'Article 25',
  article_26: 'Article 26',
  unanimite: 'Unanimité',
};

export const RESOLUTION_STATUS = { en_attente: 'En attente', adoptee: 'Adoptée', rejetee: 'Rejetée' };

export const INVOICE_KIND = {
  appel_fonds: 'Appel de fonds',
  facture: 'Facture prestataire',
  regularisation: 'Régularisation',
};

export const INVOICE_STATUS = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyée',
  partiellement_payee: 'Partiellement payée',
  payee: 'Payée',
  en_retard: 'En retard',
};

export const PAYMENT_METHOD = {
  virement: 'Virement',
  prelevement: 'Prélèvement',
  cheque: 'Chèque',
  especes: 'Espèces',
  en_ligne: 'Paiement en ligne',
};

export const PAYMENT_STATUS = { recu: 'Reçu', en_attente: 'En attente', rejete: 'Rejeté' };

export const NOTIFICATION_KIND = {
  ticket: 'Ticket',
  intervention: 'Intervention',
  facture: 'Facture',
  contrat: 'Contrat',
  assemblee: 'Assemblée',
  systeme: 'Système',
};

export const APPOINTMENT_KIND = {
  intervention: 'Intervention',
  visite: 'Visite',
  assemblee: 'Assemblée',
  reunion: 'Réunion',
};

export const APPOINTMENT_STATUS = {
  planifie: 'Planifié',
  confirme: 'Confirmé',
  realise: 'Réalisé',
  annule: 'Annulé',
};

export const THREAD_STATUS = {
  ouvert: 'Ouverte',
  en_attente: 'En attente de réponse',
  clos: 'Close',
};

export const THREAD_KIND = {
  coproprietaire: 'Copropriétaire',
  proprietaire: 'Propriétaire',
  occupant: 'Occupant',
  technicien: 'Technicien',
  prestataire: 'Prestataire',
  equipe: 'Équipe syndic',
};

export const THREAD_TONE = { ouvert: 'blue', en_attente: 'yellow', clos: 'gray' };

export const STATUS_TONES = {
  actif: 'green',
  essai: 'yellow',
  suspendu: 'red',
  archive: 'gray',
  travaux: 'yellow',
  occupe: 'green',
  vacant: 'yellow',
  sorti: 'gray',
  inactif: 'gray',
  desactive: 'gray',
  nouveau: 'blue',
  qualifie: 'yellow',
  en_cours: 'purple',
  en_attente: 'gray',
  resolu: 'green',
  clos: 'gray',
  basse: 'gray',
  normale: 'blue',
  haute: 'yellow',
  urgente: 'red',
  planifiee: 'blue',
  terminee: 'green',
  annulee: 'gray',
  preventive: 'blue',
  curative: 'red',
  controle: 'purple',
  a_renouveler: 'yellow',
  echu: 'red',
  resilie: 'gray',
  preparation: 'gray',
  convoquee: 'blue',
  cloturee: 'green',
  adoptee: 'green',
  rejetee: 'red',
  brouillon: 'gray',
  envoyee: 'blue',
  partiellement_payee: 'yellow',
  payee: 'green',
  en_retard: 'red',
  recu: 'green',
  rejete: 'red',
  invite: 'yellow',
  planifie: 'blue',
  confirme: 'green',
  realise: 'gray',
  professionnel: 'blue',
  benevole: 'green',
  cooperatif: 'purple',
};