/**
 * Contrôle d'accès à un espace syndic pour les fonctions backend.
 * Autorise les administrateurs, ainsi que les comptes rattachés à l'espace
 * (équipe du cabinet, copropriétaire, prestataire) via leur adresse e-mail.
 */
export async function userBelongsToSyndic(base44: any, user: any, syndicId: string) {
  const id = String(syndicId || '').trim();
  if (!id || !user) return false;
  if (user.role === 'admin') return true;

  const email = String(user.email || '').trim();
  if (!email) return false;

  const [team, residents, providers] = await Promise.all([
    base44.asServiceRole.entities.TeamMember.filter({ syndic_id: id, email }, { limit: 1 }),
    base44.asServiceRole.entities.Resident.filter({ syndic_id: id, email }, { limit: 1 }),
    base44.asServiceRole.entities.Provider.filter({ syndic_id: id, email }, { limit: 1 }),
  ]);

  const size = (page: any) => (Array.isArray(page) ? page.length : page?.items?.length || 0);
  return size(team) + size(residents) + size(providers) > 0;
}