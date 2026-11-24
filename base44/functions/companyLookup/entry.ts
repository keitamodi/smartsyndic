import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

import {
  cleanText,
  digits,
  NATURE_JURIDIQUE,
  NAF_LABELS,
  TRANCHE_EFFECTIF,
  workTypesFromNaf,
} from '../../shared/companies.ts';
import { fetchGoogleReviews } from '../../shared/googlePlaces.ts';

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
      model: 'gemini_3_flash',
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
    const reviewsOnly = body.reviews_only === true;
    const checkedOn = new Date().toISOString().slice(0, 10);

    if (reviewsOnly) {
      if (!name) {
        return Response.json({ error: "Renseignez le nom de l'entreprise." }, { status: 400 });
      }
      const google = await fetchGoogleReviews({
        name,
        address: String(body.address || '').trim(),
        postal_code: postalCode,
        city,
      });
      return Response.json({ google, checked_at: checkedOn });
    }

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
      headers: { Accept: 'application/json', 'User-Agent': 'Smartsyndic/1.0 (gestion de copropriete)' },
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
      const google = await fetchGoogleReviews({ name, postal_code: postalCode, city });
      return Response.json({
        company: null,
        contact: null,
        siret_status: 'introuvable',
        checked_at: checkedAt,
        google,
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

    const [contact, google] = await Promise.all([
      withContact ? findPublicContact(base44, company) : Promise.resolve(null),
      fetchGoogleReviews(company),
    ]);

    return Response.json({
      company,
      contact,
      siret_status: company.state,
      checked_at: checkedAt,
      google,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}