import { HardHat, Info, Loader2, Users } from 'lucide-react';
import Page from '@/components/Page';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import AccessCheckTable from '@/components/access/AccessCheckTable';
import useAccessAudit from '@/hooks/useAccessAudit';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';

export default function TestAcces() {
  const { syndicId } = useWorkspace();
  const { loading, error, residents, providers } = useAccessAudit(syndicId);

  // Prépare le lien personnel sans envoyer de notification : le syndic teste lui-même le compte.
  const prepareLink = async (row) => {
    try {
      const response = await base44.functions.invoke('inviteMember', {
        syndic_id: syndicId,
        prepare: true,
        ...row.invite,
      });
      return response?.data?.link || '';
    } catch {
      return '';
    }
  };

  if (!syndicId) return <WorkspaceRequired />;

  return (
    <Page
      kicker="Contrôle des accès"
      title="Vérifier les accès"
      description="Pour chaque compte résident ou technicien : ce qu’il peut ouvrir, ce qu’il verra et son lien personnel pour tester avec un vrai compte."
    >
      <div className="rounded-[18px] border border-border bg-card p-4">
        <p className="flex items-center gap-2 text-[13px] font-medium text-foreground">
          <Info className="h-4 w-4 text-primary" />
          Tester un compte de bout en bout
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[12.5px] leading-relaxed text-muted-foreground">
          <li>Copiez le lien d’accès de la personne, ou envoyez-le depuis sa fiche.</li>
          <li>Ouvrez-le dans une fenêtre de navigation privée et choisissez son mot de passe.</li>
          <li>
            Vérifiez qu’elle ne voit que les lots, immeubles ou interventions listés ci-dessous, et que les
            autres modules sont refusés.
          </li>
        </ol>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-[24px] border border-border bg-card py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <AccessCheckTable
            icon={Users}
            title="Copropriétaires, propriétaires et locataires"
            rows={residents}
            onPrepare={prepareLink}
            emptyLabel="Aucun résident avec un email : ajoutez une fiche dans Copropriétaires & propriétaires."
          />
          <AccessCheckTable
            icon={HardHat}
            title="Techniciens & prestataires"
            rows={providers}
            onPrepare={prepareLink}
            emptyLabel="Aucun technicien avec un email : ajoutez une fiche dans Techniciens & prestataires."
          />
        </>
      )}
    </Page>
  );
}