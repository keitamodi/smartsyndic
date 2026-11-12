import { useMemo, useState } from 'react';
import { ExternalLink, FileText, Plus, Trash2 } from 'lucide-react';
import TablePanel from '@/components/TablePanel';
import StatusBadge from '@/components/StatusBadge';
import FormDialog from '@/components/FormDialog';
import { Button } from '@/components/ui/button';
import useCollection from '@/hooks/useCollection';
import { base44 } from '@/api/base44Client';
import { logAction } from '@/lib/audit';
import { formatDate } from '@/lib/format';
import { DOCUMENT_CATEGORY, options } from '@/lib/constants';

const EMPTY = {
  title: '',
  category: 'comptabilite',
  building_id: '',
  published_date: '',
  visible: 'oui',
  summary: '',
  file_uri: [],
};

export default function DocumentsTab({ syndicId, buildings }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [opening, setOpening] = useState('');
  const [error, setError] = useState('');

  const query = useMemo(() => {
    const next = { syndic_id: syndicId };
    if (categoryFilter) next.category = categoryFilter;
    return next;
  }, [syndicId, categoryFilter]);

  const { items, loading, error: loadError, reload } = useCollection('Document', query, { enabled: !!syndicId, limit: 300 });

  const buildingName = (id) => buildings.find((building) => building.id === id)?.name || 'Tous les immeubles';

  const rows = items.filter((row) => {
    const haystack = `${row.title} ${row.summary} ${buildingName(row.building_id)}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const fields = [
    { name: 'title', label: 'Titre du document', required: true, span: 2, placeholder: 'PV assemblée générale 2026' },
    { name: 'category', label: 'Catégorie', type: 'select', options: options(DOCUMENT_CATEGORY) },
    {
      name: 'building_id',
      label: 'Immeuble',
      type: 'select',
      options: buildings.map((building) => ({ value: building.id, label: building.name })),
    },
    { name: 'published_date', label: 'Date de publication', type: 'date' },
    {
      name: 'visible',
      label: 'Visible par les résidents',
      type: 'select',
      options: [
        { value: 'oui', label: 'Oui' },
        { value: 'non', label: 'Non (interne)' },
      ],
    },
    { name: 'summary', label: 'Résumé', type: 'textarea', span: 2, rows: 2 },
    { name: 'file_uri', label: 'Fichier', type: 'file', span: 2, hint: 'PDF, image ou tableur (stockage privé, 10 Mo)' },
  ];

  const save = async (values) => {
    const files = Array.isArray(values.file_uri) ? values.file_uri : [];
    await base44.entities.Document.create({
      syndic_id: syndicId,
      title: values.title,
      category: values.category,
      building_id: values.building_id,
      published_date: values.published_date,
      visible_residents: values.visible === 'oui',
      summary: values.summary,
      file_uri: files[0] || '',
    });
    await logAction({ syndicId, action: 'Ajout de document', entity: 'Document', entityLabel: values.title });
    await reload();
  };

  const open = async (row) => {
    if (!row.file_uri) {
      setError('Aucun fichier n’est attaché à ce document.');
      return;
    }
    setOpening(row.id);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: row.file_uri,
        expires_in: 300,
      });
      window.open(signed_url, '_blank', 'noopener,noreferrer');
    } finally {
      setOpening('');
    }
  };

  const remove = async (row) => {
    await base44.entities.Document.delete(row.id);
    await reload();
  };

  return (
    <>
      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher un document…"
        filters={[
          {
            key: 'category',
            value: categoryFilter,
            onChange: setCategoryFilter,
            placeholder: 'Catégorie',
            allLabel: 'Toutes catégories',
            options: options(DOCUMENT_CATEGORY),
          },
        ]}
        actions={
          <Button className="gap-2" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Ajouter un document
          </Button>
        }
        columns={[
          {
            key: 'title',
            header: 'Document',
            render: (row) => (
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/70">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{row.title}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                    {DOCUMENT_CATEGORY[row.category] || 'Autre'}
                  </p>
                </div>
              </div>
            ),
          },
          { key: 'building', header: 'Immeuble', render: (row) => buildingName(row.building_id) },
          { key: 'published_date', header: 'Publié le', render: (row) => formatDate(row.published_date) },
          {
            key: 'visible',
            header: 'Visibilité',
            render: (row) => (
              <StatusBadge
                label={row.visible_residents ? 'Résidents' : 'Interne'}
                tone={row.visible_residents ? 'green' : 'gray'}
              />
            ),
          },
          {
            key: 'actions',
            header: '',
            className: 'w-24',
            render: (row) => (
              <div className="flex justify-end gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={opening === row.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    open(row);
                  }}
                  aria-label="Ouvrir le document"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    remove(row);
                  }}
                  aria-label="Supprimer le document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        error={loadError || error}
        empty={{
          icon: FileText,
          title: 'Aucun document',
          description: 'Publiez les PV d’assemblée, contrats, attestations d’assurance et documents comptables.',
          action: (
            <Button className="gap-2" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Ajouter un document
            </Button>
          ),
        }}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Nouveau document"
        description="Les fichiers sont stockés de façon privée et ouverts via un lien sécurisé temporaire."
        fields={fields}
        initialValues={EMPTY}
        onSubmit={save}
        submitLabel="Publier le document"
      />
    </>
  );
}