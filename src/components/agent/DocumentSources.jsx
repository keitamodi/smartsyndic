import { Link } from 'react-router-dom';
import { ArrowUpRight, FileText } from 'lucide-react';
import { formatDate } from '@/lib/format';

const CATEGORY_LABELS = {
  assemblee: 'Assemblée générale',
  contrat: 'Contrat',
  assurance: 'Assurance',
  comptabilite: 'Comptabilité',
  technique: 'Technique',
  reglementation: 'Réglementation',
  autre: 'Autre',
};

export default function DocumentSources({ documents, mode, loading }) {
  return (
    <aside className="hidden rounded-[22px] border border-border bg-card p-3 xl:block">
      <p className="kicker px-1">Base documentaire</p>
      <p className="mt-1 px-1 text-[11px] leading-snug text-muted-foreground">
        {loading
          ? 'Chargement…'
          : `${documents.length} document(s) ${mode === 'resident' ? 'visibles par les copropriétaires' : 'intégrés à votre espace'}.`}
      </p>
      <ul className="mt-2 space-y-1.5">
        {documents.slice(0, 10).map((document) => (
          <li key={document.id} className="rounded-xl bg-secondary/50 px-2.5 py-2">
            <p className="line-clamp-2 text-[11.5px] font-medium leading-snug text-foreground">{document.title}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {CATEGORY_LABELS[document.category] || 'Document'}
              {document.published_date ? ` · ${formatDate(document.published_date)}` : ''}
            </p>
          </li>
        ))}
        {!loading && documents.length === 0 && (
          <li className="flex gap-2 px-1 py-2 text-[11px] leading-snug text-muted-foreground">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
            Ajoutez des documents dans AG &amp; Documents pour enrichir les réponses.
          </li>
        )}
      </ul>
      <Link
        to="/assemblees"
        className="mt-3 flex items-center gap-1 px-1 text-[11px] font-medium text-primary"
      >
        Gérer les documents
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </aside>
  );
}