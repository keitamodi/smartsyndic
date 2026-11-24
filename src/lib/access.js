/**
 * Modèle d'accès unique de l'application.
 * Le syndic définit les niveaux dans Paramètres › Accès ; chaque profil en déduit
 * les modules qu'il peut ouvrir et, pour l'équipe, son périmètre d'immeubles.
 */

export const SHARED_MODULES = ['guide', 'help', 'about'];

export const ALL_MODULES = [
  'dashboard',
  'buildings',
  'interventions',
  'tickets',
  'contracts',
  'assemblies',
  'agent',
  'messaging',
  'residents',
  'providers',
  'quotes',
  'partners',
  'team',
  'billing',
  'settings',
  'subscription',
  'portal',
  'my_building',
  'my_interventions',
  'access_test',
  ...SHARED_MODULES,
];

export const MODULE_LABELS = {
  dashboard: 'Tableau de bord',
  buildings: 'Immeubles',
  interventions: 'Interventions',
  tickets: 'Tickets & demandes',
  contracts: 'Contrats',
  assemblies: 'AG & Documents',
  agent: 'Agent IA',
  messaging: 'Messagerie',
  residents: 'Copropriétaires & propriétaires',
  providers: 'Techniciens & prestataires',
  quotes: 'Demandes de devis',
  partners: 'Entreprises partenaires',
  team: 'Équipe',
  billing: 'Appel de fonds',
  settings: 'Paramètres',
  subscription: 'Abonnement & tarifs',
  portal: 'Mon espace',
  my_building: 'Mon immeuble',
  my_interventions: 'Mes interventions',
  access_test: 'Vérifier les accès',
};

export const ROUTE_MODULES = {
  '/tableau-de-bord': 'dashboard',
  '/immeubles': 'buildings',
  '/maintenance': 'interventions',
  '/tickets': 'tickets',
  '/contrats': 'contracts',
  '/assemblees': 'assemblies',
  '/agent-ia': 'agent',
  '/messagerie': 'messaging',
  '/residents': 'residents',
  '/prestataires': 'providers',
  '/devis': 'quotes',
  '/partenaires': 'partners',
  '/equipe': 'team',
  '/facturation': 'billing',
  '/parametres': 'settings',
  '/abonnement': 'subscription',
  '/mon-espace': 'portal',
  '/mon-immeuble': 'my_building',
  '/mes-interventions': 'my_interventions',
  '/test-acces': 'access_test',
};

/** Modules du quotidien pour chaque rôle de collaborateur. */
const TEAM_ROLE_MODULES = {
  administrateur: ['dashboard', 'buildings', 'interventions', 'tickets', 'contracts', 'assemblies', 'agent', 'messaging', 'residents', 'providers'],
  directeur: ['dashboard', 'buildings', 'interventions', 'tickets', 'contracts', 'assemblies', 'agent', 'messaging', 'residents', 'providers'],
  gestionnaire: ['dashboard', 'buildings', 'interventions', 'tickets', 'contracts', 'assemblies', 'agent', 'messaging', 'residents', 'providers'],
  assistant: ['dashboard', 'buildings', 'tickets', 'interventions', 'residents', 'messaging', 'assemblies'],
  comptable: ['dashboard', 'buildings', 'residents', 'contracts'],
};

/** Modules ouverts en plus du rôle, pilotés par les interrupteurs du syndic. */
const TEAM_EXTRA_MODULES = [
  { field: 'team_access_finance', modules: ['billing'] },
  { field: 'team_access_partners', modules: ['partners', 'quotes'] },
  { field: 'team_access_settings', modules: ['settings'] },
];

const EXTRA_MODULES = TEAM_EXTRA_MODULES.flatMap((entry) => entry.modules);

export const ROLE_LABELS = {
  administrateur: 'Administrateur',
  directeur: 'Directeur',
  gestionnaire: 'Gestionnaire',
  assistant: 'Assistant',
  comptable: 'Comptable',
  technicien: 'Technicien',
};

const unique = (list) => [...new Set(list)];

function teamAccess(profile, syndicId, settings) {
  const level = settings.access_team || 'complet';
  const role = profile.member?.role || settings.team_default_role || 'gestionnaire';
  const buildingIds = (profile.member?.building_ids || []).filter(Boolean);

  if (level === 'bloque') {
    return {
      kind: 'equipe',
      syndicId,
      isSyndic: false,
      role,
      level,
      blocked: true,
      allowed: [...SHARED_MODULES],
      caps: {},
      buildingIds: null,
    };
  }

  const base = TEAM_ROLE_MODULES[role] || TEAM_ROLE_MODULES.gestionnaire;
  const extras = TEAM_EXTRA_MODULES.filter(
    (entry) => level === 'complet' || settings[entry.field] !== false,
  ).flatMap((entry) => entry.modules);
  const daily = level === 'limite' ? base.filter((module) => !EXTRA_MODULES.includes(module)) : base;

  return {
    kind: 'equipe',
    syndicId,
    isSyndic: false,
    role,
    level,
    blocked: false,
    allowed: unique([...daily, ...extras, ...SHARED_MODULES]),
    caps: {},
    buildingIds: buildingIds.length ? buildingIds : null,
  };
}

function residentAccess(profile, syndicId, settings) {
  const landlord = profile.resident_kind === 'proprietaire_bailleur';
  const level = settings[landlord ? 'access_proprio' : 'access_copro'] || 'complet';
  const prefix = landlord ? 'r_proprio_' : 'r_copro_';
  const blocked = level === 'bloque';
  const enabled = (feature) => level === 'complet' || settings[`${prefix}${feature}`] !== false;

  return {
    kind: 'resident',
    syndicId,
    isSyndic: false,
    role: landlord ? 'proprietaire' : 'coproprietaire',
    level,
    blocked,
    // Le copropriétaire ne voit que : ses charges et reçus, la maintenance de son
    // immeuble et ses dépannages, l'agent IA et la messagerie avec le syndic.
    allowed: blocked
      ? [...SHARED_MODULES]
      : ['portal', 'my_building', 'agent', 'messaging', ...SHARED_MODULES],
    caps: blocked
      ? {}
      : {
          finances: enabled('finances'),
          docs: enabled('docs'),
          tickets: enabled('tickets'),
          assemblies: enabled('agenda'),
        },
    buildingIds: null,
  };
}

function technicianAccess(profile, syndicId, settings) {
  const level = settings.access_tech || 'complet';
  const blocked = level === 'bloque';
  const enabled = (feature) => level === 'complet' || settings[`r_tech_${feature}`] !== false;

  return {
    kind: 'technicien',
    syndicId,
    isSyndic: false,
    role: 'technicien',
    level,
    blocked,
    // Le technicien ne voit que : ses interventions et maintenances, la messagerie
    // avec le syndic et l'agent IA pour ses questions de droits et devoirs.
    allowed: blocked
      ? [...SHARED_MODULES]
      : ['my_interventions', 'agent', 'messaging', ...SHARED_MODULES],
    caps: blocked
      ? {}
      : {
          interventions: enabled('interventions'),
          tickets: enabled('tickets'),
          docs: enabled('docs'),
          reports: enabled('reports'),
        },
    buildingIds: null,
  };
}

export function resolveAccess(profile = {}) {
  const kind = profile.kind || 'inconnu';
  const settings = profile.settings || {};
  const syndicId = profile.syndic?.id || '';

  if (kind === 'syndic') {
    return {
      kind,
      syndicId,
      isSyndic: true,
      role: 'syndic',
      level: 'complet',
      blocked: false,
      allowed: [...ALL_MODULES],
      caps: {},
      buildingIds: null,
    };
  }
  if (kind === 'equipe') return teamAccess(profile, syndicId, settings);
  if (kind === 'technicien') return technicianAccess(profile, syndicId, settings);
  if (kind === 'resident') return residentAccess(profile, syndicId, settings);

  return {
    kind: 'inconnu',
    syndicId,
    isSyndic: false,
    role: 'invite',
    level: 'limite',
    blocked: false,
    allowed: ['dashboard', 'portal', ...SHARED_MODULES],
    caps: { finances: true, docs: true, tickets: true, assemblies: true },
    buildingIds: null,
  };
}

/** Repli permissif : une erreur réseau ne doit jamais verrouiller un syndic. */
export const UNRESTRICTED = {
  kind: 'syndic',
  syndicId: '',
  isSyndic: true,
  role: 'syndic',
  level: 'complet',
  blocked: false,
  allowed: [...ALL_MODULES],
  caps: {},
  buildingIds: null,
};

export const homePath = (access) => {
  if (access?.kind === 'technicien') return '/mes-interventions';
  if (access?.kind === 'resident' || access?.kind === 'inconnu') return '/mon-espace';
  return '/tableau-de-bord';
};