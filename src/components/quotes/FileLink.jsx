import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FileLink({ uri, label }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const open = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 600 });
      const url = result?.signed_url || result?.data?.signed_url;
      if (url) window.open(url, '_blank', 'noopener');
      else setError('lien indisponible');
    } catch {
      setError('ouverture impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={open}
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-[11.5px] text-foreground/75 transition-colors hover:border-primary/40 hover:text-foreground"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
      ) : (
        <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate">
        {label || decodeURIComponent(String(uri).split('/').pop() || 'Document')}
      </span>
      {error && <span className="shrink-0 text-destructive">· {error}</span>}
    </button>
  );
}