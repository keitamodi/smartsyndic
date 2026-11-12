import { useRef, useState } from 'react';
import { Loader2, Paperclip, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const MAX_SIZE = 10 * 1024 * 1024;

export default function FileField({ values = [], onChange, hint }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of files) {
        if (file.size > MAX_SIZE) throw new Error(`« ${file.name} » dépasse 10 Mo.`);
        const result = await base44.integrations.Core.UploadPrivateFile({ file });
        uploaded.push(result.file_uri);
      }
      onChange([...values, ...uploaded]);
    } catch (uploadError) {
      setError(uploadError?.message || "Le téléversement a échoué.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleFiles} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
          {uploading ? 'Téléversement…' : 'Ajouter un fichier'}
        </Button>
        <span className="text-[11px] text-muted-foreground">
          {values.length > 0 ? `${values.length} fichier(s) joint(s)` : hint || 'Stockage privé, 10 Mo par fichier'}
        </span>
      </div>

      {values.length > 0 && (
        <ul className="mt-2 space-y-1">
          {values.map((uri, index) => (
            <li key={uri || index} className="flex items-center gap-2 text-[12px] text-foreground/70">
              <Paperclip className="h-3 w-3 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{decodeURIComponent(uri.split('/').pop() || uri)}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onChange(values.filter((_, position) => position !== index))}
                aria-label="Retirer ce fichier"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 text-[11.5px] text-destructive">{error}</p>}
    </div>
  );
}