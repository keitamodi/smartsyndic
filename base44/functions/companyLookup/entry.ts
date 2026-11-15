import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const NATURE_JURIDIQUE = {
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

const TRANCHE_EFFECTIF = {
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

const NAF_LABELS = {
  '4120': 'Construction d’immeubles',
  '4321': 'Installation électrique',
  '4322': 'Plomberie, eau et chauffage',
  '4329': 'Travaux d’installation spécialisés',
  '4331': 'Travaux de plâtrerie',
  '4332': 'Menuiserie',
  '4333': 'Revêtement des sols et des murs',
  '4334': 'Peinture et vitrerie (ravalement)',
  '4391': 'Travaux de couverture',
  '4399': 'Travaux spécialisés de construction',
  '3312': 'Réparation de machines et d’équipements',
  '3320': 'Installation de machines et d’équipements',
  '8121': 'Nettoyage courant des bâtiments',
  '8122': 'Autres activités de nettoyage',
  '8129': 'Nettoyage spécialisé',
  '8130': 'Aménagement paysager',
  '6832': 'Gestion d’immeubles',
};

const NAF_WORK_TYPES = [
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
  ['4399', ['autre']],
];

function digits(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

function workTypesFromNaf(naf) {
  const code = digits(naf).slice(0, 4);
  const found = NAF_WORK_TYPES.find((row) => row[0] === code);
  return found ? found[1] : [];
}

function cleanText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function cleanPhone(value) {
  const raw = cleanText(value);
  if (!raw || /^(non|n\/a|na|inconnu|aucun)/i.test(raw)) return '';
  const digitsOnly = raw.replace(/[^0-9+]/g, '');
  return digitsOnly.length >= 9 ? raw.slice(0, 40) : '';
}

function cleanEmail(value) {
  const raw = cleanText(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw) ? raw : '';
}

function cleanWebsite(value) {
  const raw = cleanText(value);
  if (!/^https?:\/\//i.test(raw)) return '';
  try {
    return new URL(raw).origin + new URL(raw).pathname.replace(/\/$/, '');
  } catch {
    return '';
  }
}

async function findPublicContact(base44, company) {
  try {
    const prompt = [
      'Tu recherches les coordonnées professionnelles PUBLIQUES d’une entreprise française.',
      `Raison sociale : ${company.legal_name || company.name}`,
      `SIREN : ${company.siren || 'inconnu'} · SIRET : ${company.siret || 'inconnu'}`,
      `Adresse : ${company.address || 'inconnue'}`,
      'Cherche sur le web : annuaire-entreprises.data.gouv.fr, le site officiel de l’entreprise, les pages jaunes, les annuaires professionnels du bâtiment.',
      'Réponds uniquement avec les informations réellement publiées. N’invente JAMAIS un numéro de téléphone, une adresse e-mail ou un site : si l’information n’apparaît pas explicitement, renvoie une chaîne vide.',
    ].join('\n');

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Téléphone publié, ou chaîne vide' },
          email: { type: 'string', description: 'E-mail publié, ou chaîne vide' },
          website: { type: 'string', description: 'Site officiel (URL complète), ou chaîne vide' },
          source: { type: 'string', description: 'Site où l’information a été trouvée' },
        },
        required: ['phone', 'email', 'website', 'source'],
      },
    });

    const data = typeof result === 'string' ? {} : result || {};
    const contact = {
      phone: cleanPhone(data.phone),
      email: cleanEmail(data.email),
      website: cleanWebsite(data.website),
      source: cleanText(data.source).slice(0, 120),
    };
    if (!contact.phone && !contact.email && !contact.website) return null;
    return contact;
  } catch (error) {
    return null;
  }
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const siret = digits(body.siret);
    const name = String(body.name || '').trim();
    const postalCode = String(body.postal_code || '').trim();
    const city = String(body.city || '').trim();
    const withContact = body.enrich !== false;

    if (!siret && !name) {
      return Response.json({ error: "Renseignez un SIRET ou le nom de l'entreprise." }, { status: 400 });
    }
    if (siret && siret.length !== 14) {
      return Response.json({ error: 'Un SIRET comporte 14 chiffres.' }, { status: 400 });
    }

    const params = new URLSearchParams({ page: '1', per_page: '1' });
    params.set('q', siret || name);
    if (!siret && postalCode) params.set('code_postal', postalCode);

    const searchUrl = `https://recherche-entreprises.api.gouv.fr/search?${params.toString()}`;
    const requestInit = {
      headers: { Accept: 'application/json', 'User-Agent': 'SyndicVibe/1.0 (gestion de copropriete)' },
      signal: AbortSignal.timeout(12000),
    };

    let searchRes = await fetch(searchUrl, requestInit);
    for (let attempt = 0; attempt < 2 && !searchRes.ok && searchRes.status >= 429; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      searchRes = await fetch(searchUrl, requestInit);
    }

    if (!searchRes.ok) {
      return Response.json(
        {
          error: "L'API Recherche d'entreprises est momentanément indisponible. Réessayez dans un instant.",
          status: 'non_verifie',
          upstream: searchRes.status,
        },
        { status: 502 },
      );
    }

    const payload = await searchRes.json().catch(() => ({}));
    const match = Array.isArray(payload.results) ? payload.results[0] : null;
    const checkedAt = new Date().toISOString().slice(0, 10);

    if (!match) {
      return Response.json({
        company: null,
        contact: null,
        siret_status: 'introuvable',
        checked_at: checkedAt,
        google: { status: 'indisponible', reason: 'api_non_configuree' },
      });
    }

    const siege = match.siege || {};
    const matching = Array.isArray(match.matching_etablissements) ? match.matching_etablissements : [];
    const etab = matching.find((item) => item.siret === siret) || siege;

    const legalFormCode = String(match.nature_juridique || '');
    const tranche = String(match.tranche_effectif_salarie || '');
    const nafCode = etab.activite_principale || match.activite_principale || '';
    const dirigeants = (Array.isArray(match.dirigeants) ? match.dirigeants : [])
      .slice(0, 3)
      .map((item) => {
        const fullName =
          cleanText(item.nom_complet) ||
          [item.prenoms, item.nom].map(cleanText).filter(Boolean).join(' ');
        if (!fullName) return '';
        const quality = cleanText(item.qualite);
        const usefulQuality = quality && quality.toLowerCase() !== 'autre' ? quality : '';
        return usefulQuality ? `${fullName} — ${usefulQuality}` : fullName;
      })
      .filter(Boolean);

    const company = {
      name: match.nom_complet || match.nom_raison_sociale || name,
      legal_name: match.nom_raison_sociale || match.nom_complet || '',
      legal_form: legalFormCode,
      legal_form_label: NATURE_JURIDIQUE[legalFormCode] || '',
      naf_code: nafCode,
      naf_label:
        etab.libelle_activite_principale ||
        match.libelle_activite_principale ||
        NAF_LABELS[digits(nafCode).slice(0, 4)] ||
        '',
      siren: match.siren || '',
      siret: etab.siret || siret,
      address: etab.adresse || siege.adresse || '',
      postal_code: etab.code_postal || siege.code_postal || '',
      city: etab.libelle_commune || siege.libelle_commune || city,
      state: match.etat_administratif === 'A' ? 'valide' : 'ferme',
      employees: TRANCHE_EFFECTIF[tranche] || '',
      created_at: etab.date_creation || siege.date_creation || match.date_creation || '',
      dirigeants,
      contact_name: dirigeants.length > 0 ? dirigeants[0].split(' — ')[0] : '',
      work_types: workTypesFromNaf(nafCode),
    };

    const contact = withContact ? await findPublicContact(base44, company) : null;

    return Response.json({
      company,
      contact,
      siret_status: company.state,
      checked_at: checkedAt,
      google: { status: 'indisponible', reason: 'api_non_configuree' },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}