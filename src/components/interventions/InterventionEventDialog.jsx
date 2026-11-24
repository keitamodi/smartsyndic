import { useMemo, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import TimeField from './TimeField';
import {
  DAY_FIRST,
  DAY_LAST,
  MONTHS,
  PRIORITY_ORDER,
  STEP,
  WEEKDAYS_LONG,
  endMinutes,
  isoDay,
  startMinutes,
} from './calendar-utils';
import { INTERVENTION_PRIORITY } from '@/lib/constants';
import { cn } from '@/lib/utils';

const nextStart = (from, ranges) =>
  ranges.reduce((limit, [start]) => (start > from ? Math.min(limit, start) : limit), DAY_LAST);

const firstFree = (ranges) => {
  let candidate = 9 * 60;
  while (candidate < DAY_LAST && ranges.some(([start, end]) => candidate >= start && candidate < end)) {
    candidate += STEP;
  }
  return candidate;
};

export default function InterventionEventDialog({ day, editing, siblings, onClose, onSave, onDelete, technician = null }) {
  const busy = useMemo(() => siblings.map((item) => [startMinutes(item), endMinutes(item)]), [siblings]);

  const [title, setTitle] = useState(editing?.title || '');
  const [priority, setPriority] = useState(editing?.priority || 'normale');
  const [start, setStart] = useState(() => (editing ? startMinutes(editing) : firstFree(busy)));
  const [end, setEnd] = useState(() => {
    if (editing) return endMinutes(editing);
    const initial = firstFree(busy);
    return Math.min(initial + 60, nextStart(initial, busy));
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startOptions = useMemo(() => {
    const list = [];
    for (let minutes = DAY_FIRST; minutes <= DAY_LAST - STEP; minutes += STEP) {
      if (!busy.some(([from, to]) => minutes >= from && minutes < to)) list.push(minutes);
    }
    return list;
  }, [busy]);

  const limit = nextStart(start, busy);
  const endOptions = useMemo(() => {
    const list = [];
    for (let minutes = DAY_FIRST + STEP; minutes <= limit; minutes += STEP) {
      if (minutes > start) list.push(minutes);
    }
    return list;
  }, [limit, start]);

  const changeStart = (value) => {
    setStart(value);
    const cap = nextStart(value, busy);
    if (end <= value || end > cap) setEnd(Math.min(value + 60, cap));
  };

  const save = async () => {
    const clean = title.trim();
    if (!clean || saving) return;
    setSaving(true);
    setError('');
    try {
      await onSave(
        {
          title: clean,
          scheduled_date: isoDay(day),
          scheduled_time: `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`,
          duration_minutes: Math.max(STEP, end - start),
          priority,
          ...(technician && !editing && technician.id ? { provider_id: technician.id } : {}),
        },
        editing,
      );
      onClose();
    } catch (saveError) {
      setError(saveError?.message || "L'enregistrement a échoué.");
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError('');
    try {
      await onDelete(editing);
      onClose();
    } catch (deleteError) {
      setError(deleteError?.message || 'La suppression a échoué.');
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-32px)] max-w-[400px] gap-0 overflow-visible p-6">
        <DialogTitle className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {editing ? 'Modifier l’intervention' : 'Nouvelle intervention'}
        </DialogTitle>

        <div className="mt-3 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 rounded-[4px]"
            style={{ background: `var(--ivc-${priority})` }}
          />
          <input
            autoFocus
            value={title}
            maxLength={60}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                save();
              }
            }}
            placeholder="Ex. Révision annuelle de la chaudière"
            className="w-full border-0 border-b border-border bg-transparent pb-1.5 font-heading text-[18px] font-semibold tracking-tight text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground"
          />
        </div>

        <div className="mt-6 grid gap-2.5">
          <p className="text-[13px] font-medium capitalize text-foreground">
            {WEEKDAYS_LONG[(day.getDay() + 6) % 7]} {day.getDate()} {MONTHS[day.getMonth()]}
          </p>

          {technician && !editing && (
            <p className="text-[11.5px] text-muted-foreground">Intervenant : {technician.name}</p>
          )}

          {startOptions.length === 0 ? (
            <p className="text-[12px] text-destructive">Aucun créneau libre ce jour-là.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <TimeField label="Heure de début" value={start} options={startOptions} onChange={changeStart} />
              <span className="text-muted-foreground">–</span>
              <TimeField
                label="Heure de fin"
                value={end}
                options={endOptions}
                onChange={setEnd}
                durationsFrom={start}
              />
            </div>
          )}
        </div>

        <fieldset className="mt-6 flex gap-2.5 border-0 p-0">
          <legend className="sr-only">Importance de l’intervention</legend>
          {PRIORITY_ORDER.map((value) => (
            <label
              key={value}
              title={INTERVENTION_PRIORITY[value]}
              className={cn('ivc-swatch', `ivc-swatch--${value}`, priority === value && 'ivc-swatch--active')}
            >
              <input
                type="radio"
                name="priority"
                value={value}
                checked={priority === value}
                onChange={() => setPriority(value)}
                className="sr-only"
              />
              <span className="sr-only">{INTERVENTION_PRIORITY[value]}</span>
            </label>
          ))}
        </fieldset>

        {error && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</p>}

        {confirmDelete ? (
          <div className="mt-6 flex items-center gap-2">
            <p className="text-[13px] font-medium text-foreground">Supprimer cette intervention ?</p>
            <span className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Annuler
            </Button>
            <Button variant="destructive" size="sm" onClick={remove} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Supprimer'}
            </Button>
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-2">
            {editing && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 px-0 text-destructive hover:bg-transparent hover:text-destructive/80"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </Button>
            )}
            <span className="flex-1" />
            <Button onClick={save} disabled={saving || !title.trim() || startOptions.length === 0}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Enregistrer'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}