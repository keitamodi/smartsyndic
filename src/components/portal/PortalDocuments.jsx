import { FileText } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import FileLink from '@/components/quotes/FileLink';
import { formatDate } from '@/lib/format';
import { DOCUMENT_CATEGORY } from '@/lib/constants';

export default function PortalDocuments({ documents = [], buildings = [] }) {
  return (
    <section className="rounded-[24px] border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <h2 className="text-[13px] font-medium text-foreground">Documents de ma copropriété</h2>
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          {documents.length}
        </span>
      </div>

      {!documents.length ? (
        <EmptyState
          compact
          icon={FileText}
          title="Aucun document partagé"
          description="PV d’assemblée, règlement de copropriété, diagnostics : votre syndic publie ici les documents qui vous concernent."
        />
      ) : (
        <ul className="divide-y divide-border/60">
          {documents.map((doc) => {
            const building = buildings.find((row) => row.id === doc.building_id);
            return (
              <li key={doc.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-medium text-foreground">{doc.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {DOCUMENT_CATEGORY[doc.category] || 'Document'}
                    {building?.name ? ` · ${building.name}` : ''} · {formatDate(doc.published_date)}
                  </p>
                </div>
                {doc.file_uri ? (
                  <FileLink uri={doc.file_uri} label="Ouvrir" />
                ) : (
                  <span className="shrink-0 text-[11px] text-muted-foreground">—</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}