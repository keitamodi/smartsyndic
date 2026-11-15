export const NATURE_JURIDIQUE = {
  '1000': 'Entrepreneur individuel',
  '2110': 'Indivision',
  '5191': 'Société d’exercice libéral',
  '5307': 'Société civile',
  '5410': 'SARL',
  '5470': 'EURL',
  '5499': 'SARL',
  '5505': 'SA',
  '5510': 'SA à conseil d’administration',
  '5599': 'SA',
  '5710': 'SAS',
  '5720': 'SASU',
  '6540': 'SCI',
  '9220': 'Association déclarée',
};

export const TRANCHE_EFFECTIF = {
  '00': '0 salarié',
  '01': '1 à 2 salariés',
  '02': '3 à 5 salariés',
  '03': '6 à 9 salariés',
  '11': '10 à 19 salariés',
  '12': '20 à 49 salariés',
  '21': '50 à 99 salariés',
  '22': '100 à 199 salariés',
  '31': '200 à 249 salariés',
  '32': '250 à 499 salariés',
  '41': '500 à 999 salariés',
  '42': '1 000 à 1 999 salariés',
  '51': '2 000 à 4 999 salariés',
  '52': '5 000 à 9 999 salariés',
  '53': '10 000 salariés et plus',
};

export const NAF_LABELS = {
  '4120': 'Construction d’immeubles',
  '4312': 'Terrassement',
  '4321': 'Installation électrique',
  '4322': 'Plomberie, eau et chauffage',
  '4329': 'Travaux d’installation spécialisés',
  '4331': 'Travaux de plâtrerie',
  '4332': 'Menuiserie, serrurerie',
  '4333': 'Revêtement des sols et des murs',
  '4334': 'Peinture et vitrerie (ravalement)',
  '4391': 'Travaux de couverture',
  '4399': 'Travaux spécialisés de construction',
  '3312': 'Réparation de machines et d’équipements',
  '3320': 'Installation de machines et d’équipements',
  '2511': 'Fabrication de structures métalliques',
  '2572': 'Serrurerie et quincaillerie',
  '8020': 'Systèmes de sécurité et télésurveillance',
  '8121': 'Nettoyage courant des bâtiments',
  '8122': 'Autres activités de nettoyage',
  '8129': 'Nettoyage spécialisé',
  '8130': 'Aménagement paysager',
  '6832': 'Gestion d’immeubles',
  '6831': 'Agences immobilières',
};

export const NAF_WORK_TYPES = [
  ['4322', ['plomberie', 'chauffage']],
  ['4321', ['electricite']],
  ['4391', ['toiture']],
  ['4334', ['ravalement']],
  ['3312', ['ascenseur']],
  ['3320', ['ascenseur']],
  ['8130', ['espaces_verts']],
  ['8121', ['nettoyage']],
  ['8122', ['nettoyage']],
  ['8129', ['nettoyage']],
  ['4332', ['autre']],
  ['4329', ['autre']],
  ['8020', ['autre']],
  ['4399', ['autre']],
];

// Métiers courants d’une copropriété → codes NAF officiels (nomenclature 2025)
export const TRADE_NAF = [
  {
    label: 'Électricité',
    keys: ['electricite', 'electrique', 'electricien', 'electriciens'],
    codes: ['43.21A', '43.21B', '33.14Z'],
  },
  {
    label: 'Plomberie',
    keys: ['plomberie', 'plombier', 'plombiers', 'sanitaire'],
    codes: ['43.22A', '43.22B'],
  },
  {
    label: 'Chauffage et climatisation',
    keys: ['chauffage', 'chauffagiste', 'climatisation', 'clim', 'ventilation'],
    codes: ['43.22B', '33.12Z'],
  },
  {
    label: 'Serrurerie',
    keys: ['serrurerie', 'serrurier', 'serruriers', 'metallerie'],
    codes: ['43.32B', '25.72Z', '25.11Z'],
  },
  {
    label: 'Isolation',
    keys: ['isolation', 'isolant', 'isolants', 'isolation thermique'],
    codes: ['43.29A'],
  },
  {
    label: 'Toiture et étanchéité',
    keys: ['toiture', 'couvreur', 'couverture', 'etancheite', 'zinguerie'],
    codes: ['43.91A', '43.91B'],
  },
  {
    label: 'Ravalement et peinture',
    keys: ['ravalement', 'facade', 'facades', 'peinture', 'peintre', 'vitrerie', 'vitrier'],
    codes: ['43.34Z'],
  },
  {
    label: 'Ascenseur',
    keys: ['ascenseur', 'ascenseurs', 'elevateur'],
    codes: ['33.12Z', '43.29B'],
  },
  {
    label: 'Espaces verts',
    keys: ['espaces verts', 'jardin', 'jardinage', 'paysagiste'],
    codes: ['81.30Z'],
  },
  {
    label: 'Nettoyage',
    keys: ['nettoyage', 'menage', 'entretien', 'ramonage', 'ramoneur'],
    codes: ['81.21Z', '81.22Z', '81.29A', '81.29B'],
  },
  {
    label: 'Maçonnerie',
    keys: ['maconnerie', 'macon', 'gros oeuvre', 'terrassement'],
    codes: ['43.99C', '41.20A', '43.12A'],
  },
  {
    label: 'Menuiserie',
    keys: ['menuiserie', 'menuisier', 'portail', 'fermeture'],
    codes: ['43.32A', '16.23Z', '25.11Z'],
  },
  {
    label: 'Plâtrerie et carrelage',
    keys: ['platrerie', 'plaquiste', 'platre', 'carrelage', 'carreleur'],
    codes: ['43.31Z', '43.33Z'],
  },
  {
    label: 'Sécurité et désinsectisation',
    keys: ['alarme', 'securite', 'telesurveillance', 'deratisation', 'desinsectisation', 'nuisibles'],
    codes: ['80.20Z', '81.29B'],
  },
  {
    label: 'Diagnostic et géométrie',
    keys: ['diagnostic', 'diagnostics', 'geometre', 'expert'],
    codes: ['71.20B', '71.12A'],
  },
];

export function digits(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

export function cleanText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

export function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function workTypesFromNaf(naf) {
  const code = digits(naf).slice(0, 4);
  const found = NAF_WORK_TYPES.find((row) => row[0] === code);
  return found ? found[1] : [];
}

export function tradeFor(query) {
  const norm = normalize(query);
  if (norm.length < 3) return null;
  let best = null;
  TRADE_NAF.forEach((trade) => {
    trade.keys.forEach((key) => {
      if (norm === key || norm.includes(key) || key.includes(norm)) {
        if (!best || key.length > best.size) best = { trade, size: key.length };
      }
    });
  });
  return best ? best.trade : null;
}

export function mapCompanyMatch(match, fallback = {}) {
  const matching = Array.isArray(match.matching_etablissements) ? match.matching_etablissements : [];
  const siege = matching[0] || match.siege || {};
  const nafCode = siege.activite_principale || match.activite_principale || '';
  const legalFormCode = String(match.nature_juridique || '');
  const tranche = String(match.tranche_effectif_salarie || siege.tranche_effectif_salarie || '');
  return {
    name: cleanText(match.nom_complet || match.nom_raison_sociale) || fallback.name || '',
    legal_name: cleanText(match.nom_raison_sociale) || cleanText(match.nom_complet),
    legal_form: legalFormCode,
    legal_form_label: NATURE_JURIDIQUE[legalFormCode] || '',
    naf_code: nafCode,
    naf_label: NAF_LABELS[digits(nafCode).slice(0, 4)] || '',
    siren: match.siren || '',
    siret: siege.siret || fallback.siret || '',
    address: cleanText(siege.adresse),
    postal_code: siege.code_postal || '',
    city: cleanText(siege.libelle_commune) || fallback.city || '',
    employees: TRANCHE_EFFECTIF[tranche] || '',
    company_created_at: siege.date_creation || match.date_creation || '',
    state: match.etat_administratif === 'A' ? 'valide' : 'ferme',
    work_types: workTypesFromNaf(nafCode),
  };
}