import { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AttachmentList({ uris = [], emptyText = 'Aucune pièce jointe.' }) {
  const [loadingUri, setLoadingUri] = useState('');

  const open = async (uri) => {
    setLoadingUri(uri);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 300 });
      window.open(signed_url, '_blank', 'noopener,noreferrer');
    } finally {
      setLoadingUri('');
    }
  };

  if (!uris.length) {
    return <p className="text-[12px] text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="space-y-1.5">
      {uris.map((uri, index) => (
        <li key={uri || index}>
          <button
            type="button"
            onClick={() => open(uri)}
            className="flex w-full items-center gap-2 rounded-lg border border-border/70 px-2.5 py-1.5 text-left text-[12px] text-foreground/80 transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate">
              {decodeURIComponent(uri.split('/').pop() || uri)}
            </span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        </li>
      ))}
      {loadingUri && <li className="text-[11px] text-muted-foreground">Préparation du lien sécurisé…</li>}
    </ul>
  );
}