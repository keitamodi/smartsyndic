export const DEFAULT_SETTINGS = {
  language: 'fr',
  timezone: 'Europe/Paris',
  date_format: 'dd/MM/yyyy',
  currency: 'EUR',

  notify_tickets: true,
  notify_interventions: true,
  notify_invoices: true,
  notify_contracts: true,
  notify_assemblies: true,
  notify_messages: true,
  email_digest: 'quotidien',
  quiet_hours: false,
  quiet_start: '20:00',
  quiet_end: '08:00',

  msg_signature: '',
  msg_auto_reply: false,
  msg_auto_reply_text: 'Merci pour votre message, je reviens vers vous sous 48 h.',
  msg_notify_residents: true,
  msg_archive_closed: false,

  agent_mode: 'syndic',
  agent_tone: 'professionnel',
  agent_sources: true,
  agent_summary: true,
  agent_retention: 'jours_90',
  agent_copy_email: false,

  r_copro_tickets: true,
  r_copro_docs: true,
  r_copro_finances: false,
  r_copro_agenda: true,

  r_proprio_tickets: true,
  r_proprio_docs: true,
  r_proprio_finances: true,
  r_proprio_agenda: true,

  r_tech_interventions: true,
  r_tech_tickets: true,
  r_tech_docs: true,
  r_tech_reports: true,

  team_default_role: 'gestionnaire',
  team_invite_email: true,
  team_scope_restricted: false,
  team_validation_required: true,

  access_copro: 'complet',
  access_proprio: 'complet',
  access_tech: 'complet',
  access_team: 'complet',

  team_access_finance: true,
  team_access_partners: true,
  team_access_settings: true,
};

export const normalizeSettings = (raw = {}) =>
  Object.entries(DEFAULT_SETTINGS).reduce((acc, [key, fallback]) => {
    const value = raw[key];
    acc[key] = value === undefined || value === null || value === '' ? fallback : value;
    return acc;
  }, {});

export const LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
];

export const TIMEZONE_OPTIONS = [
  { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
  { value: 'Europe/Brussels', label: 'Bruxelles (UTC+1)' },
  { value: 'Indian/Reunion', label: 'La Réunion (UTC+4)' },
  { value: 'America/Martinique', label: 'Martinique (UTC-4)' },
];

export const DATE_FORMAT_OPTIONS = [
  { value: 'dd/MM/yyyy', label: '31/12/2026' },
  { value: 'dd MMM yyyy', label: '31 déc. 2026' },
  { value: 'yyyy-MM-dd', label: '2026-12-31' },
];

export const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'CHF', label: 'Franc suisse (CHF)' },
];

export const DIGEST_OPTIONS = [
  { value: 'realtime', label: 'En temps réel' },
  { value: 'quotidien', label: 'Résumé quotidien' },
  { value: 'hebdomadaire', label: 'Résumé hebdomadaire' },
  { value: 'jamais', label: 'Aucun e-mail' },
];

export const AGENT_MODE_OPTIONS = [
  { value: 'syndic', label: 'Équipe syndic uniquement' },
  { value: 'resident', label: 'Résidents uniquement' },
  { value: 'mixte', label: 'Les deux, réponses adaptées' },
];

export const AGENT_TONE_OPTIONS = [
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'cordial', label: 'Cordial' },
  { value: 'pedagogique', label: 'Pédagogique' },
  { value: 'direct', label: 'Direct et concis' },
];

export const AGENT_RETENTION_OPTIONS = [
  { value: 'jours_30', label: '30 jours' },
  { value: 'jours_90', label: '90 jours' },
  { value: 'jours_365', label: '1 an' },
  { value: 'illimite', label: 'Sans limite' },
];

export const ACCESS_LEVEL_OPTIONS = [
  { value: 'complet', label: 'Accès complet' },
  { value: 'limite', label: 'Accès limité' },
  { value: 'bloque', label: 'Accès bloqué' },
];