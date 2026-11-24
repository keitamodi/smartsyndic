import { useCallback, useEffect, useState } from 'react';
import { Loader2, ShieldAlert, Wrench } from 'lucide-react';
import Page from '@/components/Page';
import EmptyState from '@/components/EmptyState';
import InterventionCard from '@/components/technician/InterventionCard';
import TechnicianDocuments from '@/components/technician/TechnicianDocuments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';

export default function MesInterventions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState(null);
  const [report, setReport] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await base44.functions.invoke('technicianSpace', {});
      const payload = response?.data || {};
      if (payload.error) throw new Error(payload.error);
      setData(payload);
    } catch (failure) {
      setError(
        failure?.response?.data?.error || failure?.message || 'Impossible de charger vos interventions.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (row, status, extra = {}) => {
    setSaving(true);
    setError('');
    try {
      const response = await base44.functions.invoke('technicianSpace', {
        action: 'update',
        id: row.id,
        status,
        ...extra,
      });
      if (response?.data?.error) throw new Error(response.data.error);
      await load();
      return true;
    } catch (failure) {
      setError(failure?.response?.data?.error || failure?.message || 'La mise à jour a échoué.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const confirmClose = async () => {
    if (!closing) return;
    const done = await send(closing, 'terminee', { report });
    if (done) {
      setClosing(null);
      setReport('');
    }
  };

  const items = data?.interventions || [];
  const upcoming = items.filter((row) => row.status === 'planifiee' || row.status === 'en_cours');
  const history = items.filter((row) => row.status === 'terminee' || row.status === 'annulee');
  const canReport = data?.caps?.reports !== false;
  const account = data?.provider?.contact_name || data?.provider?.name || '';

  return (
    <Page
      kicker="Espace technicien"
      title="Mes interventions"
      description="Uniquement les interventions qui vous sont affectées : démarrez l’intervention, puis saisissez votre compte rendu une fois le travail réalisé."
    >
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-[24px] border border-border bg-card py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : data?.blocked ? (
        <div className="rounded-[24px] border border-border bg-card">
          <EmptyState
            icon={ShieldAlert}
            title="Votre accès est en pause"
            description="Votre syndic a suspendu l’espace technicien pour le moment. Contactez-le pour rétablir vos interventions."
          />
        </div>
      ) : data?.caps?.interventions === false ? (
        <div className="rounded-[24px] border border-border bg-card">
          <EmptyState
            icon={ShieldAlert}
            title="Interventions non ouvertes"
            description="Votre syndic n’a pas activé la consultation des interventions pour les techniciens. Contactez-le pour obtenir vos affectations."
          />
        </div>
      ) : !items.length ? (
        <div className="rounded-[24px] border border-border bg-card">
          <EmptyState
            icon={Wrench}
            title="Aucune intervention affectée"
            description={`Rien n’est encore planifié pour ${account || data?.provider?.email || 'votre compte'}. Votre syndic vous affecte une intervention depuis la fiche du ticket ou le calendrier des interventions.`}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <p className="kicker">À traiter · {upcoming.length}</p>
            {upcoming.length ? (
              upcoming.map((row) => (
                <InterventionCard
                  key={row.id}
                  row={row}
                  saving={saving}
                  canReport={canReport}
                  onStart={(target) => send(target, 'en_cours')}
                  onFinish={(target) => {
                    setClosing(target);
                    setReport(target.report || '');
                  }}
                />
              ))
            ) : (
              <p className="rounded-[18px] border border-border/70 bg-card px-4 py-3 text-[12.5px] text-muted-foreground">
                Tout est à jour : aucune intervention en attente.
              </p>
            )}
          </section>

          {history.length > 0 && (
            <section className="space-y-3">
              <p className="kicker">Historique · {history.length}</p>
              {history.map((row) => (
                <article key={row.id} className="rounded-[20px] border border-border/70 bg-card/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-foreground/85">{row.title}</p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                        {row.building_name} · {row.completed_date || row.scheduled_date}
                      </p>
                    </div>
                    <span className="text-[11.5px] text-muted-foreground">
                      {row.status === 'annulee' ? 'Annulée' : 'Terminée'}
                    </span>
                  </div>
                  {row.report && <p className="mt-2 text-[12.5px] text-foreground/70">{row.report}</p>}
                </article>
              ))}
            </section>
          )}

          <TechnicianDocuments documents={data?.documents} />
        </div>
      )}

      <Dialog open={!!closing} onOpenChange={(open) => !open && setClosing(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Clôturer l’intervention</DialogTitle>
            <DialogDescription>{closing?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="report" className="text-xs font-medium text-foreground/80">
              Compte rendu
            </label>
            <Textarea
              id="report"
              rows={4}
              value={report}
              onChange={(event) => setReport(event.target.value)}
              placeholder="Travaux réalisés, pièces remplacées, suite à donner…"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setClosing(null)}>
              Annuler
            </Button>
            <Button onClick={confirmClose} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Marquer comme terminée
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  );
}