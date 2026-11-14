import { useState } from 'react';
import { FileText, MapPin, Plus, Users } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import TablePanel from '@/components/TablePanel';
import { Button } from '@/components/ui/button';
import { formatDate, formatEuro } from '@/lib/format';

const WORK_TYPES = {
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  toiture: 'Toiture & façades',
  chauffage: 'Chauffage',
  ascenseur: 'Ascenseur',
  ravalement: 'Ravalement',
  espaces_verts: 'Espaces verts',
  nettoyage: 'Nettoyage',
};

const REQUEST_STATUS = {
  brouillon: { label: 'Brouillon', tone: 'bg-secondary text-foreground/70' },
  envoyee: { label: 'Envoyée', tone: 'bg-sky-50 text-sky-700' },
  reponses_recues: { label: 'Réponses reçues', tone: 'bg-amber-50 text-amber-700' },
  cloturee: { label: 'Clôturée', tone: 'bg-emerald-50 text-emerald-700' },
};

const SAMPLE = [
  {
    id: 'sample-1',
    reference: 'DEV-2026-014',
    title: 'Réfection de l’étanchéité de la toiture-terrasse',
    work_type: 'toiture',
    city: 'Lyon',
    postal_code: '69003',
    status: 'reponses_recues',
    companies: 4,
    quotes: 3,
    best_amount: 18450,
    created_date: '2026-11-04',
  },
  {
    id: 'sample-2',
    reference: 'DEV-2026-013',
    title: 'Remplacement de la colonne montante eau froide',
    work_type: 'plomberie',
    city: 'Villeurbanne',
    postal_code: '69100',
    status: 'envoyee',
    companies: 3,
    quotes: 0,
    best_amount: null,
    created_date: '2026-11-07',
  },
];

export default function Devis() {
  const [search, setSearch] = useState('');

  const rows = SAMPLE.filter((row) =>
    `${row.reference} ${row.title} ${row.city}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Page
      kicker="Travaux"
      title="Demandes de devis"
      description="Décrivez un besoin, consultez plusieurs entreprises validées et comparez leurs devis avant de choisir."
      actions={
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle demande
        </Button>
      }
    >
      <StatStrip
        items={[
          { label: 'Demandes en cours', value: '2', hint: 'devis en consultation' },
          { label: 'Devis reçus', value: '3', hint: 'à comparer' },
          { label: 'Entreprises contactées', value: '7', hint: 'par e-mail ou téléphone' },
          { label: 'Montant le plus bas', value: formatEuro(18450), hint: 'sur la demande en cours' },
        ]}
      />

      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une demande, un type de travaux, une ville…"
        columns={[
          {
            key: 'title',
            header: 'Demande',
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.title}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {row.reference} · {WORK_TYPES[row.work_type]} ·{' '}
                  <MapPin className="inline h-3 w-3" /> {row.city} {row.postal_code}
                </p>
              </div>
            ),
          },
          {
            key: 'companies',
            header: 'Entreprises',
            render: (row) => (
              <span className="inline-flex items-center gap-1.5 font-mono text-[12px]">
                <Users className="h-3 w-3 text-muted-foreground" />
                {row.companies}
              </span>
            ),
          },
          {
            key: 'quotes',
            header: 'Devis',
            render: (row) => (
              <span className="inline-flex items-center gap-1.5 font-mono text-[12px]">
                <FileText className="h-3 w-3 text-muted-foreground" />
                {row.quotes}
              </span>
            ),
          },
          {
            key: 'best_amount',
            header: 'Meilleur prix',
            render: (row) =>
              row.best_amount ? (
                <span className="font-mono text-[12.5px] tnum">{formatEuro(row.best_amount)}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
          {
            key: 'status',
            header: 'Statut',
            render: (row) => (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${REQUEST_STATUS[row.status]?.tone}`}
              >
                {REQUEST_STATUS[row.status]?.label}
              </span>
            ),
          },
          {
            key: 'created_date',
            header: 'Créée le',
            render: (row) => (
              <span className="text-[12px] text-muted-foreground">{formatDate(row.created_date)}</span>
            ),
          },
        ]}
        rows={rows}
        empty={{
          icon: FileText,
          title: 'Aucune demande de devis',
          description: 'Créez une demande, joignez des photos et sollicitez vos entreprises partenaires.',
        }}
      />
    </Page>
  );
}