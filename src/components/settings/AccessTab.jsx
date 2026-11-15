import { HardHat, Home, User } from 'lucide-react';
import AccessCard from '@/components/settings/AccessCard';

const CARD = 'rounded-[18px] border border-border/70 bg-secondary/30 px-4 py-3';

export default function AccessTab({ settings, update }) {
  return (
    <div className="space-y-4">
      <div className={CARD}>
        <p className="text-[11.5px] leading-snug text-muted-foreground">
          Ces réglages définissent ce que chaque profil voit depuis son espace personnel. Votre équipe
          interne conserve tous les accès.
        </p>
      </div>

      <AccessCard
        icon={Home}
        title="Copropriétaires"
        description="Propriétaires de lots votant en assemblée générale."
        settings={settings}
        update={update}
        rows={[
          { field: 'r_copro_tickets', label: 'Créer des demandes', description: 'Signaler un problème depuis son lot.' },
          { field: 'r_copro_docs', label: 'Consulter les documents', description: 'Règlement, PV et documents partagés.' },
          { field: 'r_copro_finances', label: 'Voir leur situation financière', description: 'Appels de fonds et paiements de leur lot uniquement.' },
          { field: 'r_copro_agenda', label: 'Recevoir les convocations', description: 'Convocation et ordre du jour des assemblées.' },
        ]}
      />

      <AccessCard
        icon={User}
        title="Propriétaires bailleurs"
        description="Propriétaires non occupants, souvent hors du conseil syndical."
        settings={settings}
        update={update}
        rows={[
          { field: 'r_proprio_tickets', label: 'Créer des demandes', description: 'Demandes liées à leur lot ou aux parties communes.' },
          { field: 'r_proprio_docs', label: 'Consulter les documents', description: 'Documents généraux de la copropriété.' },
          { field: 'r_proprio_finances', label: 'Voir les charges', description: 'Appels de fonds de leurs lots.' },
          { field: 'r_proprio_agenda', label: 'Recevoir les convocations', description: 'Convocation et échéances des assemblées.' },
        ]}
      />

      <AccessCard
        icon={HardHat}
        title="Techniciens & prestataires"
        description="Intervenants externes rattachés aux interventions."
        settings={settings}
        update={update}
        rows={[
          { field: 'r_tech_interventions', label: 'Voir les interventions assignées', description: 'Uniquement les interventions qui leur sont attribuées.' },
          { field: 'r_tech_tickets', label: 'Consulter les tickets liés', description: 'Demande à l’origine de l’intervention.' },
          { field: 'r_tech_docs', label: 'Accéder aux documents techniques', description: 'Plans, contrats de maintenance et notices.' },
          { field: 'r_tech_reports', label: 'Renseigner un compte rendu', description: 'Saisie du rapport et des photos après intervention.' },
        ]}
      />
    </div>
  );
}