import { secrets } from 'base44:runtime';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.rating',
  'places.userRatingCount',
  'places.reviews',
  'places.googleMapsUri',
].join(',');

function formatReview(review: any) {
  const text = String(review?.text?.text || '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!text) return '';
  const author = String(review?.authorAttribution?.displayName || '').trim();
  const when = String(review?.relativePublishTimeDescription || '').trim();
  const signature = [author, when].filter(Boolean).join(', ');
  return signature ? `${text} — ${signature}` : text;
}

/**
 * Récupère la note et les avis Google d'une entreprise via l'API Places (New).
 * Retourne toujours { status: 'disponible' | 'indisponible' }, jamais d'exception.
 */
export async function fetchGoogleReviews(company: any = {}) {
  let apiKey = '';
  try {
    apiKey = secrets.get('GOOGLE_PLACES_API_KEY') || '';
  } catch (error) {
    apiKey = '';
  }
  if (!apiKey) return { status: 'indisponible', reason: 'api_non_configuree' };

  const query = [company.legal_name || company.name, company.address, company.postal_code, company.city]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
  if (query.length < 3) return { status: 'indisponible', reason: 'recherche_trop_courte' };

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'fr',
        regionCode: 'FR',
        maxResultCount: 1,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      return { status: 'indisponible', reason: `upstream_${response.status}` };
    }

    const payload = await response.json().catch(() => ({}));
    const place = Array.isArray(payload?.places) ? payload.places[0] : null;
    if (!place) return { status: 'indisponible', reason: 'aucune_fiche' };

    const reviews = (Array.isArray(place.reviews) ? place.reviews : [])
      .map(formatReview)
      .filter(Boolean);

    return {
      status: 'disponible',
      rating: typeof place.rating === 'number' ? place.rating : undefined,
      reviews_count: typeof place.userRatingCount === 'number' ? place.userRatingCount : undefined,
      place_id: place.id || '',
      maps_url: place.googleMapsUri || '',
      reviews,
    };
  } catch (error) {
    return { status: 'indisponible', reason: 'erreur_api' };
  }
}