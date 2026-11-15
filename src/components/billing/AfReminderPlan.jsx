import { formatDate } from '@/lib/format';
import { reminderPlan } from '@/lib/impayes';

export default function AfReminderPlan({ dueDate, cadence, onCadenceChange }) {
  const plan = reminderPlan(dueDate, cadence);

  return (
    <section className="space-y-2 border-t border-border/70 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="kicker">4 · Échéancier de rappels</p>
        <label className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
          Premier rappel
          <select
            className="h-7 rounded-md border border-input bg-background px-2 text-[11.5px] text-foreground"
            value={cadence}
            onChange={(event) => onCadenceChange(Number(event.target.value))}
          >
            <option value={5}>5 jours après l’échéance</option>
            <option value={7}>7 jours après l’échéance</option>
            <option value={15}>15 jours après l’échéance</option>
          </select>
        </label>
      </div>
      <ol className="grid gap-1.5 sm:grid-cols-3">
        {plan.map((step) => (
          <li key={step.label} className="rounded-xl border border-border/70 px-3 py-2">
            <p className="text-[11.5px] font-medium text-foreground">{step.label}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{formatDate(step.date)}</p>
          </li>
        ))}
      </ol>
      <p className="text-[11px] text-muted-foreground">
        Chaque rappel non suivi d’effet fait monter le dossier d’un cran : rappel amiable, relance écrite, mise en
        demeure, puis recouvrement contentieux. Les dates restent ajustables depuis le suivi des impayés.
      </p>
    </section>
  );
}