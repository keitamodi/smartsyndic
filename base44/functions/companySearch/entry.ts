import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { digits, mapCompanyMatch, tradeFor } from '../../shared/companies.ts';

async function resolveCity(city) {
  const raw = String(city || '').trim();
  if (!raw) return { params: {}, label: '' };
  if (/^\d{5}$/.test(raw)) return { params: { code_postal: raw }, label: raw };

  const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(
    raw,
  )}&fields=nom,code,codesPostaux&boost=population&limit=1`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return { params: null, label: raw };
  const communes = await res.json().catch(() => []);
  const found = Array.isArray(communes) ? communes[0] : null;
  const postalCodes = found && Array.isArray(found.codesPostaux) ? found.codesPostaux.slice(0, 12) : [];
  if (!found || postalCodes.length === 0) return { params: null, label: raw };
  return {
    params: { code_postal: postalCodes.join(',') },
    label: `${found.nom} (${postalCodes[0]})`,
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = String(body.query || '').trim();
    const city = String(body.city || '').trim();
    const page = Math.min(Math.max(Number(body.page) || 1, 1), 8);

    if (query.length < 2) {
      return Response.json(
        { error: 'Indiquez un métier, un nom ou une raison sociale (2 caractères minimum).' },
        { status: 400 },
      );
    }
    if (/^\d+$/.test(query)) {
      return Response.json(
        { error: 'Pour un SIRET précis, utilisez la vérification par SIRET dans la fiche entreprise.' },
        { status: 400 },
      );
    }

    const location = await resolveCity(city);
    if (location.params === null) {
      return Response.json(
        { error: `Ville « ${city} » introuvable. Vérifiez l’orthographe ou saisissez un code postal.` },
        { status: 404 },
      );
    }

    const trade = tradeFor(query);
    const params = new URLSearchParams({
      page: String(page),
      per_page: '25',
      etat_administratif: 'A',
    });
    if (trade) params.set('activite_principale', trade.codes.join(','));
    else params.set('q', query);
    Object.entries(location.params).forEach(([key, value]) => params.set(key, value));

    const url = `https://recherche-entreprises.api.gouv.fr/search?${params.toString()}`;
    const options = {
      headers: { Accept: 'application/json', 'User-Agent': 'Smartsyndic/1.0 (gestion de copropriete)' },
      signal: AbortSignal.timeout(12000),
    };

    let res = await fetch(url, options);
    for (let attempt = 0; attempt < 2 && !res.ok && res.status >= 429; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      res = await fetch(url, options);
    }
    if (!res.ok) {
      return Response.json(
        { error: "L’annuaire des entreprises est momentanément indisponible. Réessayez dans un instant." },
        { status: 502 },
      );
    }

    const payload = await res.json().catch(() => ({}));
    const results = Array.isArray(payload.results) ? payload.results : [];
    const items = results
      .map((match) => mapCompanyMatch(match))
      .filter((item) => item.name && digits(item.siret).length === 14)
      .map((item) => ({ ...item, siret_status: item.state }));

    return Response.json({
      items,
      total: Number(payload.total_results) || items.length,
      page,
      trade: trade ? trade.label : '',
      city: location.label || city,
      checked_at: new Date().toISOString().slice(0, 10),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}