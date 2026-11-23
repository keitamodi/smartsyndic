import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import Page from '@/components/Page';
import PlanCard from '@/components/pricing/PlanCard';
import CurrentPlanPanel from '@/components/subscription/CurrentPlanPanel';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useWorkspace } from '@/lib/workspace';
import useQuota from '@/hooks/useQuota';
import { base44 } from '@/api/base44Client';
import { logAction } from '@/lib/audit';
import { PLANS, planById, planRank } from '@/lib/plans';

export default function Abonnement() {
  const { syndicId, syndic, refresh } = useWorkspace();
  const { toast } = useToast();
  const { usage, reload: reloadQuota } = useQuota();
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const currentPlan = planById(syndic?.plan_tier);

  if (!syndicId) return <WorkspaceRequired />;

  const confirmChange = async () => {
    if (!target) return;
    setSaving(true);
    try {
      await base44.entities.Syndic.update(syndicId, { plan_tier: target.id });
      await logAction({
        syndicId,
        action: 'Changement de forfait',
        entity: 'Abonnement',
        entityLabel: target.name,
        details: `${currentPlan.name} → ${target.name}`,
      });
      await refresh();
      await reloadQuota();
      toast({
        title: `Forfait ${target.name} activé`,
        description: 'Vos quotas sont mis à jour immédiatement.',
      });
      setTarget(null);
    } catch (failure) {
      toast({
        title: 'Changement impossible',
        description: failure?.message || 'Réessayez dans un instant.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      kicker="Abonnement"
      title="Abonnement & tarifs"
      description="Consultez votre forfait, suivez vos quotas et changez de formule à tout moment, sans engagement."
      wide
      actions={
        <Button
          variant="outline"
          className="gap-2"
          onClick={() =>
            document
              .getElementById('abonnement-actuel')
              ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        >
          <CreditCard className="h-4 w-4" />
          Voir l'abonnement actuel
        </Button>
      }
    >
      <CurrentPlanPanel plan={currentPlan} usage={usage} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-[18px] font-semibold">Changer d'abonnement</h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Le changement prend effet immédiatement sur votre espace syndic.
            </p>
          </div>
          <p className="text-[11.5px] text-muted-foreground">
            Forfaits hors taxes, par cabinet, sans engagement de durée.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan.id;
            const upgrade = planRank(plan.id) > planRank(currentPlan.id);
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                current={isCurrent}
                footer={
                  isCurrent ? (
                    <Button variant="outline" className="w-full text-[12.5px]" disabled>
                      Forfait actuel
                    </Button>
                  ) : (
                    <Button
                      variant={upgrade ? 'default' : 'outline'}
                      className="w-full text-[12.5px]"
                      onClick={() => setTarget(plan)}
                    >
                      {upgrade ? `Passer à ${plan.name}` : `Revenir à ${plan.name}`}
                    </Button>
                  )
                }
              />
            );
          })}
        </div>

        <p className="rounded-[14px] border border-border/70 bg-secondary/40 p-4 text-[11.5px] leading-relaxed text-muted-foreground">
          Les accès portail des copropriétaires, propriétaires et techniciens restent gratuits et
          illimités quel que soit le forfait. Le paiement en ligne n'est pas encore activé : le
          changement de formule met à jour votre espace immédiatement.
        </p>
      </section>

      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Passer au forfait {target?.name}</DialogTitle>
            <DialogDescription>
              Vous quittez le forfait {currentPlan.name} pour le forfait {target?.name} (
              {target?.price} {target?.suffix}). Le changement est immédiat et sans engagement.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-1.5 rounded-xl bg-secondary/40 p-3 text-[12.5px]">
            {target?.features.map((feature) => (
              <li key={feature.label} className="flex justify-between gap-3">
                <span className="text-muted-foreground">{feature.label}</span>
                <span className="text-right font-medium">{feature.value}</span>
              </li>
            ))}
          </ul>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setTarget(null)} disabled={saving}>
              Annuler
            </Button>
            <Button className="gap-2" onClick={confirmChange} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmer le changement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}