import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { normalizeEmail } from '../../shared/memberInvite.ts';

/**
 * Profil d'accès du compte connecté.
 * Le syndic propriétaire de l'espace conserve toujours l'accès complet ;
 * les collaborateurs, copropriétaires et techniciens sont limités par les
 * réglages d'accès de l'espace et par leur rôle.
 *
 * Le cabinet du compte est enregistré sur la fiche utilisateur (champs
 * `syndic_id` et `syndic_scope`, verrouillés côté application). C'est cette
 * valeur que le cloisonnement des données utilise pour filtrer les enregistrements.
 */
const ACCESS_DEFAULTS = {
  access_copro: 'complet',
  access_proprio: 'complet',
  access_tech: 'complet',
  access_team: 'complet',
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
  team_access_finance: true,
  team_access_partners: true,
  team_access_settings: true,
  team_default_role: 'gestionnaire',
};

const pageItems = (page: any) => (Array.isArray(page) ? page : page?.items || []);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const service = base44.asServiceRole.entities;
    const email = normalizeEmail(user.email);

    const accessSettings = async (syndicId: string) => {
      const result: any = { ...ACCESS_DEFAULTS };
      if (!syndicId) return result;
      const rows = pageItems(await service.SyndicSettings.filter({ syndic_id: syndicId }, { limit: 1 }));
      const record = rows[0];
      if (!record) return result;
      for (const key of Object.keys(ACCESS_DEFAULTS)) {
        const value = record[key];
        if (value !== undefined && value !== null && value !== '') result[key] = value;
      }
      return result;
    };

    // Rattache le compte à son cabinet. Les champs sont verrouillés pour les
    // utilisateurs : seule l'application (rôle service) peut les écrire.
    const persistScope = async (syndicId: string, scope: string) => {
      const fresh: any = await service.User.get(user.id).catch(() => null);
      const currentId = String(fresh?.syndic_id || fresh?.data?.syndic_id || '');
      const currentScope = String(fresh?.syndic_scope || fresh?.data?.syndic_scope || '');
      if (currentId === String(syndicId || '') && currentScope === String(scope || '')) return;
      await service.User.update(user.id, { syndic_id: syndicId || '', syndic_scope: scope || '' });
    };

    // Ouverture d'un espace : le créateur devient membre de l'équipe de ce cabinet.
    const claimId = String(body.claim_syndic_id || '').trim();
    if (claimId) {
      const owned: any = await service.Syndic.get(claimId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!owned || owned.created_by_id !== user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      await persistScope(claimId, 'equipe');
    }

    // Comparaison normalisée : l'email saisi par le syndic peut différer par la casse.
    const teamRows = pageItems(await service.TeamMember.list({ limit: 500 }));
    const memberships = teamRows.filter((row: any) => normalizeEmail(row.email) === email);
    const member = memberships.find((row: any) => row.status !== 'desactive') || null;

    const teamProfile = async (syndicId: string, membership: any) => {
      const syndic = syndicId
        ? await service.Syndic.get(syndicId).catch((e) => (e.status === 404 ? null : Promise.reject(e)))
        : null;
      return {
        profile: {
          kind: 'equipe',
          syndic: { id: syndicId, name: syndic?.name || '' },
          member: {
            role: membership?.role || '',
            building_ids: membership?.building_ids || [],
            status: membership?.status || '',
          },
          settings: await accessSettings(syndicId),
        },
        scope: 'equipe',
      };
    };

    const resolved = await (async () => {
      // Tout compte propriétaire d'un espace syndic le gère, quel que soit son rôle :
      // c'est ainsi qu'un syndic qui vient d'ouvrir son espace (Google ou email) y accède.
      const syndics = pageItems(await service.Syndic.list());
      const ownedRows = syndics.filter((row: any) => row.created_by_id === user.id);
      if (ownedRows.length) {
          // On conserve le cabinet déjà rattaché au compte : sans cela, le
          // cloisonnement pourrait basculer d'un espace à l'autre entre deux visites.
          const fresh: any = await service.User.get(user.id).catch(() => null);
          const currentId = String(fresh?.syndic_id || fresh?.data?.syndic_id || '');
          const owned = ownedRows.find((row: any) => row.id === currentId)
            || [...ownedRows].sort((a: any, b: any) => String(a.created_date).localeCompare(String(b.created_date)))[0];
          return {
            profile: {
              kind: 'syndic',
              syndic: { id: owned.id, name: owned.name || '' },
              member: null,
              settings: await accessSettings(owned.id),
            },
            scope: 'equipe',
          };
        }
      if (user.role === 'admin') {
        if (member) return teamProfile(member.syndic_id, member);
        return { profile: { kind: 'syndic', syndic: null, member: null, settings: { ...ACCESS_DEFAULTS } }, scope: 'equipe' };
      }

      if (member) return teamProfile(member.syndic_id, member);

      const providers = pageItems(await service.Provider.filter({ email }, { limit: 1 }));
      const provider = providers[0];
      if (provider) {
        return {
          profile: {
            kind: 'technicien',
            syndic: { id: provider.syndic_id || '', name: '' },
            member: { role: 'technicien', building_ids: [], status: provider.status || '' },
            settings: await accessSettings(provider.syndic_id),
          },
          scope: 'technicien',
        };
      }

      const residents = pageItems(await service.Resident.filter({ email }, { limit: 1 }));
      const resident = residents[0];
      if (resident) {
        return {
          profile: {
            kind: 'resident',
            resident_kind: resident.kind || 'coproprietaire',
            syndic: { id: resident.syndic_id || '', name: '' },
            member: null,
            settings: await accessSettings(resident.syndic_id),
          },
          scope: 'resident',
        };
      }

      const lots = pageItems(await service.Lot.filter({ owner_email: email }, { limit: 1 }));
      const lot = lots[0];
      if (lot) {
        return {
          profile: {
            kind: 'resident',
            resident_kind: 'coproprietaire',
            syndic: { id: lot.syndic_id || '', name: '' },
            member: null,
            settings: await accessSettings(lot.syndic_id),
          },
          scope: 'resident',
        };
      }

      return { profile: { kind: 'inconnu', syndic: null, member: null, settings: { ...ACCESS_DEFAULTS } }, scope: '' };
    })();

    await persistScope(resolved.profile.syndic?.id || '', resolved.scope);

    return Response.json(resolved.profile);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}