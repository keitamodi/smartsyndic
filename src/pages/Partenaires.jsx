import { useState } from 'react';
import { BadgeCheck, Building2, Phone, Plus, Star } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import TablePanel from '@/components/TablePanel';
import { Button } from '@/components/ui/button';

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

const SAMPLE = [
  {
    id: 'p-1',
    name: 'Toiture Rhône Étanchéité',
    city: 'Lyon',
    postal_code: '69007',
    siret: '812 456 789 00021',
    status: 'valide',
    work_types: ['toiture', 'ravalement'],
    google_rating: 4.6,
    google_reviews_count: 38,
    phone: '04 78 00 11 22',
  },
  {
    id: 'p-2',
    name: 'Plomberie Dumas',
    city: 'Villeurbanne',
    postal_code: '69100',
    siret: '753 219 884 00013',
    status: 'a_verifier',
    work_types: ['plomberie', 'chauffage'],
    google_rating: null,
    google_reviews_count: 0,
    phone: '06 12 45 78 90',
  },
];

export default function Partenaires() {
  const [search, setSearch] = useState('');

  const rows = SAMPLE.filter((row) =>
    `${row.name} ${row.city} ${row.siret}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Page
      kicker="Travaux"
      title="Entreprises partenaires"
      description="Répertoire des entreprises contactées pour vos devis, validées manuellement après vérification du SIRET."
      actions={
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter une entreprise
        </Button>
      }
    >
      <StatStrip
        items={[
          { label: 'Entreprises', value: '2', hint: 'au répertoire' },
          { label: 'Validées', value: '1', hint: 'SIRET vérifié' },
          { label: 'À vérifier', value: '1', hint: 'validation en attente' },
          { label: 'Avis Google', value: '38', hint: 'cumulés' },
        ]}
      />

      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une entreprise, une ville, un SIRET…"
        columns={[
          {
            key: 'name',
            header: 'Entreprise',
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.name}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {row.work_types.map((type) => WORK_TYPES[type]).join(' · ')}
                </p>
              </div>
            ),
          },
          {
            key: 'city',
            header: 'Zone',
            render: (row) => (
              <span className="text-[12.5px] text-foreground/75">
                {row.city} {row.postal_code}
              </span>
            ),
          },
          {
            key: 'siret',
            header: 'SIRET',
            render: (row) => (
              <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-muted-foreground">
                <BadgeCheck className="h-3 w-3" />
                {row.siret}
              </span>
            ),
          },
          {
            key: 'google',
            header: 'Google',
            render: (row) =>
              row.google_rating ? (
                <span className="inline-flex items-center gap-1 font-mono text-[12px]">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {row.google_rating.toFixed(1)} ({row.google_reviews_count})
                </span>
              ) : (
                <span className="text-[11.5px] text-muted-foreground">Indisponible</span>
              ),
          },
          {
            key: 'phone',
            header: 'Contact',
            render: (row) => (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/75">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {row.phone}
              </span>
            ),
          },
        ]}
        rows={rows}
        empty={{
          icon: Building2,
          title: 'Aucune entreprise partenaire',
          description: 'Ajoutez une entreprise, vérifiez son SIRET puis validez-la pour la solliciter.',
        }}
      />
    </Page>
  );
}