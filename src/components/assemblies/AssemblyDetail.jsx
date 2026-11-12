import { useRef, useState } from 'react';
import { Loader2, Plus, Upload, Vote } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StatusBadge from '@/components/StatusBadge';
import AttachmentList from '@/components/AttachmentList';
import FormDialog from '@/components/FormDialog';
import { useToast } from '@/components/ui/use-toast';
import useCollection from '@/hooks/useCollection';
import { base44 } from '@/api/base44Client';
import { logAction, notify } from '@/lib/audit';
import { formatDate } from '@/lib/format';
import {
  ASSEMBLY_KIND,
  ASSEMBLY_STATUS,
  MAJORITY,
  options,
  RESOLUTION_STATUS,
} from '@/lib/constants';

const RESOLUTION_FIELDS = [
  { name: 'label', label: 'Résolution', required: true, span: 2, placeholder: 'Travaux de réfection de la toiture' },
  { name: 'majority', label: 'Majorité requise', type: 'select', options: options(MAJORITY) },
  { name: 'status', label: 'Résultat', type: 'select', options: options(RESOLUTION_STATUS) },
  { name: 'votes_for', label: 'Voix pour', type: 'number', min: 0 },
  { name: 'votes_against', label: 'Voix contre', type: 'number', min: 0 },
  { name: 'votes_abstain', label: 'Abstentions', type: 'number', min: 0 },
  { name: 'notes', label: 'Notes', type: 'textarea', span: 2, rows: 2 },
];

export default function AssemblyDetail({ open, onOpenChange, assembly, syndicId, residents = [], onUpdated }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [resolutionOpen, setResolutionOpen] = useState(false);

  const { items: resolutions, loading, reload } = useCollection(
    'Resolution',
    { assembly_id: assembly?.id || '__none__' },
    { enabled: !!assembly?.id },
  );

  if (!assembly) return null;

  const convoke = async () => {
    await base44.entities.Assembly.update(assembly.id, {
      status: 'convoquee',
      convoked_at: new Date().toISOString().slice(0, 10),
      convocation_sent: true,
    });
    const audience = residents.filter((resident) => resident.building_id === assembly.building_id && resident.email);
    for (const resident of audience.slice(0, 50)) {
      await notify({
        syndicId,
        recipientEmail: resident.email,
        title: `Convocation : ${assembly.title}`,
        message: `Vous êtes convoqué(e) le ${formatDate(assembly.date)} à ${assembly.time || 'l’heure indiquée'} — ${assembly.location || 'lieu à confirmer'}.`,
        kind: 'assemblee',
        link: '/assemblees',
      });
    }
    await logAction({ syndicId, action: 'Convocation AG', entity: 'Assemblée', entityLabel: assembly.title });
    toast({
      title: 'Assemblée convoquée',
      description: `${audience.length} notification(s) interne(s) créée(s).`,
    });
    await onUpdated();
  };

  const closeAssembly = async () => {
    await base44.entities.Assembly.update(assembly.id, { status: 'cloturee' });
    await logAction({ syndicId, action: 'Clôture AG', entity: 'Assemblée', entityLabel: assembly.title });
    await onUpdated();
  };

  const publishMinutes = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.Assembly.update(assembly.id, { minutes_uri: file_uri });
      await base44.entities.Document.create({
        syndic_id: syndicId,
        building_id: assembly.building_id,
        assembly_id: assembly.id,
        title: `Procès-verbal · ${assembly.title}`,
        category: 'assemblee',
        file_uri,
        published_date: new Date().toISOString().slice(0, 10),
        visible_residents: true,
        summary: 'Procès-verbal et décisions votées en assemblée générale.',
      });
      await logAction({ syndicId, action: 'Publication du PV', entity: 'Assemblée', entityLabel: assembly.title });
      toast({ title: 'Procès-verbal publié', description: 'Le document est disponible dans la rubrique AG & Documents.' });
      await onUpdated();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const saveResolution = async (values) => {
    await base44.entities.Resolution.create({
      ...values,
      syndic_id: syndicId,
      assembly_id: assembly.id,
      status: values.status || 'en_attente',
    });
    await reload();
  };

  const updateResolution = async (resolution, status) => {
    await base44.entities.Resolution.update(resolution.id, { status });
    await reload();
  };

  const totalVotes = resolutions.reduce(
    (sum, row) => sum + (Number(row.votes_for) || 0) + (Number(row.votes_against) || 0) + (Number(row.votes_abstain) || 0),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto thin-scroll sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{assembly.title}</DialogTitle>
          <DialogDescription>
            {ASSEMBLY_KIND[assembly.kind] || 'Assemblée'} · {formatDate(assembly.date)}
            {assembly.time ? ` à ${assembly.time}` : ''} · {assembly.location || 'lieu à confirmer'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge value={assembly.status} map={ASSEMBLY_STATUS} />
          <StatusBadge
            label={assembly.convocation_sent ? 'Convocation envoyée' : 'Convocation à envoyer'}
            tone={assembly.convocation_sent ? 'green' : 'yellow'}
          />
          {assembly.quorum_percent ? <StatusBadge label={`Quorum ${assembly.quorum_percent}%`} tone="neutral" /> : null}
        </div>

        {assembly.agenda && (
          <div>
            <p className="kicker mb-1">Ordre du jour</p>
            <p className="whitespace-pre-line rounded-xl bg-secondary/40 p-3 text-[12.5px] leading-relaxed text-foreground/80">
              {assembly.agenda}
            </p>
          </div>
        )}

        <div className="border-t border-border/70 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="kicker">Résolutions ({resolutions.length})</p>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setResolutionOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          </div>

          {loading ? (
            <div className="h-16 animate-pulse rounded-xl bg-secondary/50" />
          ) : resolutions.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-4 text-[12px] text-muted-foreground">
              <Vote className="h-4 w-4" />
              Aucune résolution saisie. Ajoutez les points soumis au vote.
            </div>
          ) : (
            <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
              {resolutions.map((resolution) => (
                <li key={resolution.id} className="px-3 py-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground">{resolution.label}</p>
                      <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                        {MAJORITY[resolution.majority] || 'Majorité'} · pour {resolution.votes_for || 0} · contre{' '}
                        {resolution.votes_against || 0} · abst. {resolution.votes_abstain || 0}
                      </p>
                    </div>
                    <Select value={resolution.status || 'en_attente'} onValueChange={(next) => updateResolution(resolution, next)}>
                      <SelectTrigger className="h-7 w-[128px] text-[11.5px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options(RESOLUTION_STATUS).map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {totalVotes > 0 && (
            <p className="mt-2 text-[11px] text-muted-foreground">{totalVotes} voix exprimées au total.</p>
          )}
        </div>

        <div className="border-t border-border/70 pt-4">
          <p className="kicker mb-1.5">Procès-verbal</p>
          <AttachmentList uris={assembly.minutes_uri ? [assembly.minutes_uri] : []} emptyText="Aucun PV publié." />
          <input ref={fileRef} type="file" className="hidden" onChange={publishMinutes} />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-3">
          <Button variant="outline" className="gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Publier le PV
          </Button>
          {assembly.status !== 'cloturee' && (
            <Button variant="outline" onClick={closeAssembly}>Clôturer l’assemblée</Button>
          )}
          <Button onClick={convoke}>Convoquer les copropriétaires</Button>
        </div>
      </DialogContent>

      <FormDialog
        open={resolutionOpen}
        onOpenChange={setResolutionOpen}
        title="Nouvelle résolution"
        description="Renseignez la majorité requise et le résultat du vote."
        fields={RESOLUTION_FIELDS}
        initialValues={{ label: '', majority: 'article_24', status: 'en_attente', votes_for: '', votes_against: '', votes_abstain: '', notes: '' }}
        onSubmit={saveResolution}
        submitLabel="Ajouter la résolution"
      />
    </Dialog>
  );
}