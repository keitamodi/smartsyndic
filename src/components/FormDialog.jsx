import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FileField from '@/components/FileField';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EMPTY = '';

function FieldControl({ field, value, onChange }) {
  if (field.type === 'file') {
    return (
      <FileField
        values={Array.isArray(value) ? value : []}
        onChange={(next) => onChange(field.name, next)}
        hint={field.hint}
      />
    );
  }

  if (field.type === 'textarea') {
    return (
      <Textarea
        id={field.name}
        rows={field.rows || 4}
        placeholder={field.placeholder}
        value={value ?? EMPTY}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
    );
  }

  if (field.type === 'multiselect') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-background p-2">
        {(field.options || []).length === 0 && (
          <span className="px-1 py-0.5 text-[11px] text-muted-foreground">Aucune option disponible.</span>
        )}
        {(field.options || []).map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange(
                  field.name,
                  active ? selected.filter((item) => item !== option.value) : [...selected, option.value],
                )
              }
              className={
                active
                  ? 'rounded-full border border-primary/40 bg-accent px-2.5 py-1 text-[11.5px] text-accent-foreground'
                  : 'rounded-full border border-border px-2.5 py-1 text-[11.5px] text-muted-foreground transition-colors hover:bg-secondary'
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <Select value={value ?? EMPTY} onValueChange={(next) => onChange(field.name, next)}>
        <SelectTrigger id={field.name}>
          <SelectValue placeholder={field.placeholder || 'Sélectionner'} />
        </SelectTrigger>
        <SelectContent>
          {(field.options || []).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      id={field.name}
      type={field.type || 'text'}
      placeholder={field.placeholder}
      value={value ?? EMPTY}
      min={field.min}
      max={field.max}
      step={field.step}
      onChange={(event) => onChange(field.name, event.target.value)}
    />
  );
}

export default function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields = [],
  initialValues = {},
  onSubmit,
  submitLabel = 'Enregistrer',
  notice,
}) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const key = useMemo(() => JSON.stringify(initialValues || {}), [initialValues]);

  useEffect(() => {
    if (open) {
      setValues(initialValues || {});
      setError('');
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  const update = (name, next) => setValues((previous) => ({ ...previous, [name]: next }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const missing = fields.find(
      (field) => field.required && !String(values[field.name] ?? '').trim(),
    );
    if (missing) {
      setError(`Le champ « ${missing.label} » est obligatoire.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = fields.reduce((acc, field) => {
        const raw = values[field.name];
        if (field.type === 'file') {
          acc[field.name] = Array.isArray(raw) ? raw : [];
          return acc;
        }
        if (raw === EMPTY || raw === undefined || raw === null) {
          acc[field.name] = field.type === 'number' ? undefined : '';
          return acc;
        }
        acc[field.name] = field.type === 'number' ? Number(raw) : raw;
        return acc;
      }, {});
      await onSubmit(payload, values);
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError?.message || "L'enregistrement a échoué. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto thin-scroll sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.name}
                className={field.span === 2 ? 'sm:col-span-2' : undefined}
              >
                <Label htmlFor={field.name} className="mb-1.5 block text-xs font-medium text-foreground/80">
                  {field.label}
                  {field.required && <span className="ml-1 text-primary">*</span>}
                </Label>
                <FieldControl field={field} value={values[field.name]} onChange={update} />
                {field.hint && <p className="mt-1 text-[11px] text-muted-foreground">{field.hint}</p>}
              </div>
            ))}
          </div>

          {notice && (
            <p className="rounded-xl bg-secondary/70 px-3 py-2 text-xs text-muted-foreground">{notice}</p>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}