import FileLink from '@/components/quotes/FileLink';
import { formatDate } from '@/lib/format';

export default function TechnicianDocuments({ documents }) {
  if (!documents?.length) return null;

  return (
    <section className="rounded-[20px] border border-border bg-card p-4">
      <p className="kicker">Documents techniques · {documents.length}</p>
      <p className="mt-1 text-[11.5px] text-muted-foreground">
        Plans et notices des immeubles où vous intervenez.
      </p>
      <ul className="mt-3 space-y-2">
        {documents.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground/85">{row.title}</p>
              <p className="text-[11.5px] text-muted-foreground">
                {row.building_name}
                {row.published_date ? ` · ${formatDate(row.published_date)}` : ''}
              </p>
            </div>
            {row.file_uri ? (
              <FileLink uri={row.file_uri} label="Ouvrir" />
            ) : (
              <span className="text-[11.5px] text-muted-foreground">Aucun fichier</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}