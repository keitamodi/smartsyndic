import { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, Loader2, PlayCircle, Wrench } from 'lucide-react';
import Page from '@/components/Page';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { INTERVENTION_PRIORITY, INTERVENTION_STATUS, PRIORITY_TONE } from '@/lib/constants';
import { formatDate } from '@/lib/format';

export default function MesInterventions() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState(null);
  const [report, setReport] = useState('');
  const [saving, setSaving] = useState(false);

  const email = user?.email || '';
  const today = new Date().toISOString().slice(0, 10);

  const load = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const page = await base44.entities.Intervention.filter(
        { provider_email: email },
        { sort: 'scheduled_date', limit: 100 },
      );
      setItems(page.items || []);
    } catch (failure) {
      setError(failure?.message || 'Impossible de charger vos interventions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const setStatus = async (row, status, extra = {}) => {
    setSaving(true);
    try {
      await base44.entities.Intervention.update(row.id, { status, ...extra });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const openClose = (row) => {
    setClosing(row);
    setReport(row.report || '');
  };

  const confirmClose = async () => {
    if (!closing) return;
    await setStatus(closing, 'terminee', { report, completed_date: today });
    setClosing(null);
    setReport('');
  };

  const upcoming = items.filter((row) => row.status === 'planifiee' || row.status === 'en_cours');
  const done = items.filter((row) => row.status === 'terminee' || row.status === 'annulee');

  return (
    <Page
      kicker="Espace technicien"
      title="Mes interventions"
      description="Les interventions qui vous sont affectées : démarrez l’intervention, puis saisissez votre compte rendu une fois le travail réalisé."
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
      ) : !items.length ? (
        <div className="rounded-[24px] border border-border bg-card">
          <EmptyState
            icon={Wrench}
            title="Aucune intervention affectée"
            description={`Rien n’est encore planifié pour ${email || 'votre compte'}. Votre syndic vous affecte une intervention depuis la fiche du ticket ou le calendrier des interventions.`}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <p className="kicker">À traiter · {upcoming.length}</p>
            {upcoming.map((row) => (
              <article key={row.id} className="rounded-[20px] border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{row.title}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {row.building_name || 'Immeuble non précisé'}
                      {row.scheduled_date ? ` · ${formatDate(row.scheduled_date)}` : ''}
                      {row.scheduled_time ? ` à ${row.scheduled_time}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge value={row.priority || 'normale'} map={INTERVENTION_PRIORITY} tone={PRIORITY_TONE[row.priority || 'normale']} />
                    <StatusBadge value={row.status} map={INTERVENTION_STATUS} />
                  </div>
                </div>

                {row.description && (
                  <p className="mt-3 whitespace-pre-line text-[12.5px] leading-relaxed text-foreground/75">
                    {row.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {row.status !== 'en_cours' && (
                    <Button size="sm" variant="outline" className="gap-1.5" disabled={saving} onClick={() => setStatus(row, 'en_cours')}>
                      <PlayCircle className="h-4 w-4" />
                      Démarrer
                    </Button>
                  )}
                  <Button size="sm" className="gap-1.5" disabled={saving} onClick={() => openClose(row)}>
                    <CheckCircle2 className="h-4 w-4" />
                    Terminer
                  </Button>
                </div>
              </article>
            ))}
          </section>

          {done.length > 0 && (
            <section className="space-y-3">
              <p className="kicker">Historique · {done.length}</p>
              {done.map((row) => (
                <article key={row.id} className="rounded-[20px] border border-border/70 bg-card/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-foreground/85">{row.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {formatDate(row.completed_date || row.scheduled_date)}
                      </p>
                    </div>
                    <StatusBadge value={row.status} map={INTERVENTION_STATUS} />
                  </div>
                  {row.report && <p className="mt-2 text-[12.5px] text-foreground/70">{row.report}</p>}
                </article>
              ))}
            </section>
          )}
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