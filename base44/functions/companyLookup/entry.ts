import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

function digits(value) {
  return String(value || '').replace(/[^0-9]/g, '');
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

    if (!siret && !name) {
      return Response.json({ error: "Renseignez un SIRET ou le nom de l'entreprise." }, { status: 400 });
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
        siret_status: 'introuvable',
        checked_at: checkedAt,
        google: { status: 'indisponible', reason: 'api_non_configuree' },
      });
    }

    const siege = match.siege || {};
    const company = {
      name: match.nom_complet || match.nom_raison_sociale || name,
      legal_name: match.nom_raison_sociale || match.nom_complet || '',
      legal_form: match.nature_juridique || '',
      naf_code: siege.activite_principale || match.activite_principale || '',
      siren: match.siren || '',
      siret: siege.siret || siret,
      address: siege.adresse || '',
      postal_code: siege.code_postal || '',
      city: siege.libelle_commune || city,
      state: match.etat_administratif === 'A' ? 'valide' : 'ferme',
      employees: match.tranche_effectif_salarie || '',
      created_at: siege.date_creation || '',
    };

    return Response.json({
      company,
      siret_status: company.state,
      checked_at: checkedAt,
      google: { status: 'indisponible', reason: 'api_non_configuree' },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}