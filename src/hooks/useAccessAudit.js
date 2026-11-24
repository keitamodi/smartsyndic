import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { inviteLink } from '@/lib/inviteLinks';

const norm = (value) => String(value || '').trim().toLowerCase();
const digits = (value) => String(value || '').replace(/\D/g, '');

const RESIDENT_LABELS = {
  coproprietaire: 'Copropriétaire',
  proprietaire_bailleur: 'Propriétaire bailleur',
  occupant: 'Locataire / occupant',
};

const RESIDENT_INVITE_KIND = {
  coproprietaire: 'coproprietaire',
  proprietaire_bailleur: 'proprietaire',
  occupant: 'locataire',
};

const STATUS = {
  acceptee: { label: 'Compte activé', tone: 'green' },
  en_attente: { label: 'Invitation en attente', tone: 'yellow' },
};

const plural = (count, one, many) => `${count} ${count > 1 ? many : one}`;

/**
 * Contrôle des accès : pour chaque fiche résident et prestataire, ce que le compte
 * verra une fois connecté, l'état de son invitation et son lien personnel.
 */
export default function useAccessAudit(syndicId) {
  const [state, setState] = useState({ loading: true, error: '', residents: [], providers: [] });

  useEffect(() => {
    if (!syndicId) return undefined;
    let active = true;

    (async () => {
      try {
        const [residentsPage, providersPage, lotsPage, buildingsPage, interventionsPage, invitesPage] =
          await Promise.all([
            base44.entities.Resident.filter({ syndic_id: syndicId }, { limit: 300 }),
            base44.entities.Provider.filter({ syndic_id: syndicId }, { limit: 300 }),
            base44.entities.Lot.filter({ syndic_id: syndicId }, { limit: 500 }),
            base44.entities.Building.filter({ syndic_id: syndicId }, { limit: 100 }),
            base44.entities.Intervention.filter({ syndic_id: syndicId }, { limit: 300 }),
            base44.entities.MemberInvite.filter({ syndic_id: syndicId }, { limit: 200 }),
          ]);

        const lots = lotsPage.items || [];
        const buildings = buildingsPage.items || [];
        const interventions = interventionsPage.items || [];
        const invites = invitesPage.items || [];

        const buildingName = (id) => buildings.find((row) => row.id === id)?.name || 'Immeuble non précisé';
        const inviteFor = (person) =>
          invites.find(
            (row) =>
              (norm(row.email) && norm(row.email) === norm(person.email)) ||
              (digits(row.phone) && digits(row.phone) === digits(person.phone)),
          ) || null;
        const statusOf = (invite) => STATUS[invite?.status] || { label: 'Aucun accès ouvert', tone: 'gray' };

        const residents = (residentsPage.items || [])
          .filter((row) => row.email || row.phone)
          .map((row) => {
            const mine = lots.filter(
              (lot) => lot.resident_id === row.id || (row.email && norm(lot.owner_email) === norm(row.email)),
            );
            const ids = [...new Set(mine.map((lot) => lot.building_id).filter(Boolean))];
            const invite = inviteFor(row);
            const status = statusOf(invite);
            return {
              id: row.id,
              name: row.full_name || row.email || 'Sans nom',
              email: row.email || row.phone || '',
              profile: RESIDENT_LABELS[row.kind] || 'Copropriétaire',
              status: status.label,
              statusTone: status.tone,
              scope: mine.length
                ? `${plural(mine.length, 'lot', 'lots')} · ${plural(ids.length, 'immeuble', 'immeubles')}`
                : 'Aucun lot rattaché',
              detail: mine.length
                ? `Lots ${mine.map((lot) => lot.number).filter(Boolean).join(', ') || '—'} · ${ids.map(buildingName).join(', ')}`
                : 'Renseignez son immeuble et ses lots sur sa fiche.',
              link: invite?.token ? inviteLink(invite.token) : '',
              warning: '',
              invite: {
                kind: RESIDENT_INVITE_KIND[row.kind] || 'coproprietaire',
                member_id: row.id,
                member_type: 'resident',
                full_name: row.full_name || '',
                email: row.email || '',
                phone: row.phone || '',
                building_id: row.building_id || '',
                building_name: buildingName(row.building_id),
                lot_numbers: row.lot_numbers || '',
              },
            };
          });

        const providers = (providersPage.items || [])
          .filter((row) => row.email)
          .map((row) => {
            const assigned = interventions.filter(
              (item) => item.provider_id === row.id || norm(item.provider_email) === norm(row.email),
            );
            const orphan = interventions.filter(
              (item) => item.provider_id === row.id && norm(item.provider_email) !== norm(row.email),
            );
            const ticketCount = new Set(assigned.map((item) => item.ticket_id).filter(Boolean)).size;
            const invite = inviteFor(row);
            const status = statusOf(invite);
            return {
              id: row.id,
              name: row.contact_name || row.name || row.email,
              email: row.email,
              profile: 'Technicien / prestataire',
              status: status.label,
              statusTone: status.tone,
              scope: `${plural(assigned.length, 'intervention', 'interventions')} · ${plural(ticketCount, 'demande liée', 'demandes liées')}`,
              detail: [...new Set(assigned.map((item) => item.building_name).filter(Boolean))].join(', ') || 'Aucune intervention affectée',
              link: invite?.token ? inviteLink(invite.token) : '',
              warning: orphan.length
                ? `${plural(orphan.length, 'intervention est', 'interventions sont')} affectée(s) à sa fiche sans son email : elles n’apparaîtront pas dans son espace. Réaffectez-les en choisissant ce prestataire.`
                : '',
              invite: {
                kind: 'technicien',
                member_id: row.id,
                member_type: 'provider',
                full_name: row.contact_name || row.name || '',
                email: row.email || '',
                phone: row.phone || '',
                building_id: '',
                building_name: '',
                lot_numbers: '',
              },
            };
          });

        if (active) setState({ loading: false, error: '', residents, providers });
      } catch (failure) {
        if (active) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: failure?.message || 'Impossible de charger les accès.',
          }));
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [syndicId]);

  return state;
}