import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InterventionEventDialog from './InterventionEventDialog';
import { MONTHS, PRIORITY_ORDER, WEEKDAYS_SHORT, formatRange, isoDay, startMinutes } from './calendar-utils';
import { INTERVENTION_PRIORITY, PRIORITY_ICON_TONE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import './calendar.css';

export default function InterventionCalendar({ interventions, month, onMonthChange, onSave, onDelete, loading }) {
  const [draft, setDraft] = useState(null);

  const todayKey = isoDay(new Date());
  const todayWeekday = (new Date().getDay() + 6) % 7;

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const weeks = Math.ceil((offset + last.getDate()) / 7);
    const list = [];
    for (let index = 0; index < weeks * 7; index += 1) {
      list.push(new Date(month.getFullYear(), month.getMonth(), 1 - offset + index));
    }
    return list;
  }, [month]);

  const byDay = useMemo(() => {
    const map = {};
    interventions.forEach((item) => {
      if (!item.scheduled_date) return;
      const key = String(item.scheduled_date).slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => startMinutes(a) - startMinutes(b)));
    return map;
  }, [interventions]);

  const shift = (delta) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  const siblings = draft ? (byDay[isoDay(draft.day)] || []).filter((item) => item.id !== draft.editing?.id) : [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(-1)} aria-label="Mois précédent">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(1)} aria-label="Mois suivant">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-[12px]" onClick={() => onMonthChange(new Date())}>
            Aujourd’hui
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <p className="font-heading text-[15px] font-semibold capitalize text-foreground">
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </p>
        </div>
      </div>

      <div className="ivc-section">
        <div className="ivc-card rise-in">
          <div className="ivc-head" aria-hidden="true">
            {WEEKDAYS_SHORT.map((label, index) => (
              <p
                key={label}
                className={cn('ivc-head-cell', index === todayWeekday && 'ivc-head-cell--today')}
                style={{ '--ivc-c': index }}
              >
                {label}
              </p>
            ))}
          </div>

          <div className="ivc-grid">
            {days.map((day, index) => {
              const key = isoDay(day);
              const events = byDay[key] || [];
              const out = day.getMonth() !== month.getMonth();
              const isToday = key === todayKey;
              const weekday = (day.getDay() + 6) % 7;

              return (
                <div
                  key={key}
                  className={cn(
                    'ivc-day',
                    out && 'ivc-day--out',
                    isToday && 'ivc-day--today-col',
                    events.length === 0 && 'ivc-day--empty',
                  )}
                  style={{ '--ivc-r': Math.floor(index / 7), '--ivc-c': weekday }}
                  onClick={() => {
                    if (!out) setDraft({ day, editing: null });
                  }}
                >
                  <ul className="ivc-events">
                    {events.map((event, eventIndex) => (
                      <li key={event.id} className="ivc-item" style={{ '--ivc-i': eventIndex }}>
                        <button
                          type="button"
                          className={cn(
                            'ivc-ev',
                            `ivc-ev--${event.priority || 'normale'}`,
                            eventIndex > 0 && 'ivc-ev--inline',
                            eventIndex === 0 && events.length === 1 && 'ivc-ev--tall',
                          )}
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            setDraft({ day, editing: event });
                          }}
                        >
                          <span className="ivc-ev-title">{event.title}</span>
                          <span className="ivc-ev-time">{formatRange(event)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  <p className="ivc-meta">
                    <span className="ivc-meta-day">{WEEKDAYS_SHORT[weekday]}</span>
                    <span className={cn('ivc-date', isToday && 'ivc-date--today')}>{day.getDate()}</span>
                  </p>

                  {!out && (
                    <button
                      type="button"
                      className="ivc-add"
                      aria-label={`Planifier une intervention le ${day.getDate()} ${MONTHS[day.getMonth()]}`}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        setDraft({ day, editing: null });
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="ivc-add-label">Ajouter</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="kicker !text-[9px]">Importance</span>
        {PRIORITY_ORDER.map((value) => (
          <span key={value} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn('h-2 w-2 rounded-full', PRIORITY_ICON_TONE[value])} />
            {INTERVENTION_PRIORITY[value]}
          </span>
        ))}
      </div>

      {draft && (
        <InterventionEventDialog
          key={`${isoDay(draft.day)}-${draft.editing?.id || 'new'}`}
          day={draft.day}
          editing={draft.editing}
          siblings={siblings}
          onClose={() => setDraft(null)}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}