import { useEffect, useState } from 'react';
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
import { openCheckoutUrl, startStripeCheckout } from '@/lib/stripeCheckout';

export default function Abonnement() {
  const { syndicId, syndic, refresh } = useWorkspace();
  const { toast } = useToast();
  const { usage, reload: reloadQuota } = useQuota();
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  // Lien de paiement préparé à l'ouverture du récapitulatif, et lien de secours
  // si le navigateur bloque l'ouverture automatique de l'onglet Stripe.
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [manualUrl, setManualUrl] = useState('');

  const currentPlan = planById(syndic?.plan_tier);

  // Retour de Stripe : le forfait est confirmé auprès de Stripe puis appliqué,
  // pour que le paiement se termine sans attendre la livraison du webhook.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get('checkout');
    if (!state) return;
    const sessionId = params.get('session_id') || '';
    window.history.replaceState({}, '', window.location.pathname);

    if (state === 'cancel') {
      toast({ title: 'Paiement annulé', description: 'Aucun montant n’a été prélevé.', variant: 'destructive' });
      return;
    }
    if (state !== 'success') return;

    let alive = true;
    let timer;
    (async () => {
      let tier = '';
      if (sessionId) {
        try {
          const response = await base44.functions.invoke('confirmSubscriptionCheckout', { session_id: sessionId });
          tier = response.data?.plan_tier || '';
        } catch {
          /* le webhook Stripe reste la source de vérité */
        }
      }
      if (!alive) return;
      await refresh();
      await reloadQuota();
      toast(
        tier
          ? {
              title: `Forfait ${planById(tier).name} activé`,
              description: 'Votre abonnement est actif et vos quotas sont à jour.',
            }
          : {
              title: 'Paiement confirmé',
              description: 'Votre forfait sera activé dès réception du paiement.',
            },
      );
      // Paiement encore en cours de validation : on réinterroge une fois.
      if (!tier) {
        timer = setTimeout(() => {
          if (!alive) return;
          refresh();
          reloadQuota();
        }, 4000);
      }
    })();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Offre choisie depuis la page Tarifs : on ouvre directement le récapitulatif de paiement.
  const [planChecked, setPlanChecked] = useState(false);
  useEffect(() => {
    if (planChecked || !syndic) return;
    const wanted = new URLSearchParams(window.location.search).get('plan');
    const plan = wanted ? PLANS.find((item) => item.id === wanted) : null;
    if (plan && plan.id !== 'free' && plan.id !== currentPlan.id) setTarget(plan);
    setPlanChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syndic]);

  // Le lien de paiement est préparé dès l'ouverture du récapitulatif : le clic
  // ouvre alors Stripe immédiatement, sans risque d'être bloqué par le navigateur.
  useEffect(() => {
    setCheckoutUrl('');
    setManualUrl('');
    if (!target || target.id === 'free' || syndic?.stripe_subscription_id) return;
    // Hors aperçu intégré, le clic peut attendre la création de la session :
    // inutile de préparer un lien et d'accumuler des sessions Stripe abandonnées.
    if (window.self === window.top) return;
    let alive = true;
    base44.functions
      .invoke('createSubscriptionCheckout', { plan_id: target.id })
      .then((response) => {
        if (alive && response.data?.url) setCheckoutUrl(response.data.url);
      })
      .catch(() => {
        /* le clic relancera la création et affichera le message d'erreur */
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id, syndic?.stripe_subscription_id]);

  if (!syndicId) return <WorkspaceRequired />;

  const confirmChange = async () => {
    if (!target) return;
    setSaving(true);
    try {
      if (target.id !== 'free') {
        // Lien déjà prêt : on ouvre la page de paiement sans attendre.
        if (checkoutUrl && openCheckoutUrl(checkoutUrl)) {
          setTarget(null);
          return;
        }
        const result = await startStripeCheckout(async () => {
          const response = await base44.functions.invoke('createSubscriptionCheckout', { plan_id: target.id });
          return response.data;
        });
        // Onglet bloqué : on propose le lien de paiement direct dans la fenêtre.
        if (result?.manual && result?.url) {
          setManualUrl(result.url);
          return;
        }
        // Cabinet déjà abonné : le tarif a été modifié directement, sans nouveau paiement.
        if (result?.updated) {
          await refresh();
          await reloadQuota();
          toast({
            title: `Forfait ${target.name} activé`,
            description: 'Votre abonnement est mis à jour ; la différence est facturée au prorata.',
          });
        }
        setTarget(null);
        return;
      }
      // Gratuit : on résilie d'abord l'abonnement Stripe pour arrêter les prélèvements.
      await base44.functions.invoke('cancelSubscription', {});
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
          illimités quel que soit le forfait. Les forfaits payants sont réglés par carte bancaire via
          Stripe ; le retour au forfait Gratuit se fait immédiatement, sans prélèvement.
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
            {manualUrl ? (
              <Button asChild className="gap-2">
                <a href={manualUrl} target="_blank" rel="noreferrer">
                  Ouvrir la page de paiement
                </a>
              </Button>
            ) : (
              <Button className="gap-2" onClick={confirmChange} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {target?.id === 'free' ? 'Confirmer le changement' : 'Payer avec Stripe'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}