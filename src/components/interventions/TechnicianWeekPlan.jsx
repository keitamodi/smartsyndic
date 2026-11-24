import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import InterventionEventDialog from './InterventionEventDialog';
import { MONTHS, WEEKDAYS_SHORT, formatRange, isoDay, startMinutes } from './calendar-utils';
import { cn } from '@/lib/utils';
import './calendar.css';

const UNASSIGNED = '__unassigned__';

const startOfWeek = (date) => {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return new Date(day.getTime() - ((day.getDay() + 6) % 7) * 86400000);
};

const shiftDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const dayKey = (value) => String(value || '').slice(0, 10);

const cellId = (laneId, key) => `${laneId}|${key}`;

export default function TechnicianWeekPlan({ interventions, providers = [], month, onSave, onDelete, loading }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(month || new Date()));
  const [draft, setDraft] = useState(null);
  const [moving, setMoving] = useState(false);
  const dragEnded = useRef(false);

  const todayKey = isoDay(new Date());

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => shiftDays(weekStart, index)), [weekStart]);
  const dayKeys = useMemo(() => days.map(isoDay), [days]);

  const weekItems = useMemo(
    () => interventions.filter((item) => item.scheduled_date && dayKeys.includes(dayKey(item.scheduled_date))),
    [interventions, dayKeys],
  );

  // Un couloir par technicien ; les interventions sans intervenant sont regroupées en bas.
  const lanes = useMemo(() => {
    const map = new Map();
    providers.forEach((provider) =>
      map.set(provider.id, { id: provider.id, name: provider.name || 'Intervenant', provider, items: [] }),
    );
    const orphans = { id: UNASSIGNED, name: 'À affecter', provider: null, items: [] };

    weekItems.forEach((item) => {
      let lane = item.provider_id ? map.get(item.provider_id) : null;
      if (!lane && item.provider_name) {
        const key = `name:${item.provider_name}`;
        lane = map.get(key);
        if (!lane) {
          lane = {
            id: key,
            name: item.provider_name,
            provider: { id: item.provider_id || '', name: item.provider_name, email: item.provider_email || '' },
            items: [],
          };
          map.set(key, lane);
        }
      }
      (lane || orphans).items.push(item);
    });

    const list = Array.from(map.values()).sort(
      (a, b) => Number(b.items.length > 0) - Number(a.items.length > 0) || a.name.localeCompare(b.name),
    );
    if (orphans.items.length) list.push(orphans);
    return list;
  }, [providers, weekItems]);

  // Glisser une intervention vers un autre jour ou un autre technicien la replanifie.
  const handleDragEnd = async (result) => {
    // Évite d'ouvrir la fiche juste après un glisser-déposer.
    dragEnded.current = true;
    window.setTimeout(() => {
      dragEnded.current = false;
    }, 300);

    const { source, destination, draggableId } = result;
    if (!destination || moving) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const [sourceLaneId] = source.droppableId.split('|');
    const [destLaneId, destDay] = destination.droppableId.split('|');
    const item = interventions.find((entry) => entry.id === draggableId);
    if (!item || !destDay) return;

    const lane = lanes.find((entry) => entry.id === destLaneId);
    const values = {
      scheduled_date: destDay,
      scheduled_time: item.scheduled_time || '09:00',
    };
    if (destLaneId !== sourceLaneId) {
      values.provider_id = lane?.provider?.id || '';
      values.provider_name = lane?.provider?.name || '';
      values.provider_email = lane?.provider?.email || '';
    }

    setMoving(true);
    try {
      await onSave(values, item);
    } finally {
      setMoving(false);
    }
  };

  const total = weekItems.length;

  return (
    <div className="ivc-section">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setWeekStart(shiftDays(weekStart, -7))}
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setWeekStart(shiftDays(weekStart, 7))}
            aria-label="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-[12px]" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Cette semaine
          </Button>
        </div>
        <p className="font-heading text-[13px] font-medium capitalize text-foreground">
          {days[0].getDate()} {MONTHS[days[0].getMonth()]} – {days[6].getDate()} {MONTHS[days[6].getMonth()]}{' '}
          {days[6].getFullYear()}
          <span className="ml-2 font-body text-[11.5px] font-normal text-muted-foreground">
            {total} intervention{total > 1 ? 's' : ''} planifiée{total > 1 ? 's' : ''}
          </span>
        </p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto rounded-[calc(var(--radius)+6px)] border border-border bg-card">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[148px_repeat(7,minmax(0,1fr))] border-b border-border bg-muted/50">
              <p className="kicker px-3 py-2">Technicien</p>
              {days.map((day, index) => {
                const isToday = isoDay(day) === todayKey;
                return (
                  <div
                    key={isoDay(day)}
                    className={cn('border-l border-border px-2 py-2 text-center', isToday && 'bg-accent/70')}
                  >
                    <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{WEEKDAYS_SHORT[index]}</p>
                    <p className={cn('tnum font-heading text-[13px] font-semibold', isToday ? 'text-primary' : 'text-foreground')}>
                      {day.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {loading && !lanes.length ? (
              <div className="flex items-center justify-center gap-2 py-10 text-[12px] text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement du planning…
              </div>
            ) : !lanes.length ? (
              <p className="px-3 py-8 text-center text-[12.5px] text-muted-foreground">
                Aucun technicien enregistré : ajoutez-en dans « Techniciens &amp; prestataires » pour planifier leur semaine.
              </p>
            ) : (
              lanes.map((lane) => (
                <div
                  key={lane.id}
                  className="grid grid-cols-[148px_repeat(7,minmax(0,1fr))] border-b border-border last:border-b-0"
                >
                  <div className="px-3 py-2.5">
                    <p className="truncate text-[12.5px] font-medium text-foreground">{lane.name}</p>
                    <p className="truncate text-[10.5px] text-muted-foreground">
                      {lane.items.length
                        ? `${lane.items.length} intervention${lane.items.length > 1 ? 's' : ''}`
                        : 'Disponible'}
                    </p>
                  </div>

                  {days.map((day) => {
                    const key = isoDay(day);
                    const cellItems = lane.items
                      .filter((item) => dayKey(item.scheduled_date) === key)
                      .sort((a, b) => startMinutes(a) - startMinutes(b));
                    const isToday = key === todayKey;

                    return (
                      <Droppable key={key} droppableId={cellId(lane.id, key)} type="INTERVENTION">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              'ivc-plan-cell min-h-[74px] border-l border-border p-1.5',
                              isToday && 'bg-accent/40',
                              snapshot.isDraggingOver && 'bg-primary/10',
                            )}
                          >
                            <div className="flex flex-col gap-1">
                              {cellItems.map((item, index) => (
                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                  {(drag, dragSnapshot) => (
                                    <button
                                      ref={drag.innerRef}
                                      {...drag.draggableProps}
                                      {...drag.dragHandleProps}
                                      type="button"
                                      className={cn(
                                        'ivc-ev ivc-ev--compact',
                                        `ivc-ev--${item.priority || 'normale'}`,
                                        dragSnapshot.isDragging && 'shadow-lg ring-2 ring-primary/40',
                                      )}
                                      onClick={() => {
                                        if (dragEnded.current) return;
                                        setDraft({ day, lane, editing: item });
                                      }}
                                    >
                                      <span className="ivc-ev-title">{item.title}</span>
                                      <span className="ivc-ev-time">{formatRange(item)}</span>
                                    </button>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                              <button
                                type="button"
                                className="ivc-plan-add"
                                aria-label={`Planifier le ${day.getDate()} ${MONTHS[day.getMonth()]} pour ${lane.name}`}
                                onClick={() => setDraft({ day, lane, editing: null })}
                              >
                                <Plus className="h-3 w-3" />
                                Planifier
                              </button>
                            </div>
                          </div>
                        )}
                      </Droppable>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </DragDropContext>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Glissez une intervention vers un autre jour ou un autre technicien pour la replanifier.
      </p>

      {draft && (
        <InterventionEventDialog
          key={`${isoDay(draft.day)}-${draft.lane.id}-${draft.editing?.id || 'new'}`}
          day={draft.day}
          editing={draft.editing}
          providers={providers}
          technician={draft.editing ? null : draft.lane.provider}
          siblings={draft.lane.items.filter(
            (item) => dayKey(item.scheduled_date) === isoDay(draft.day) && item.id !== draft.editing?.id,
          )}
          onClose={() => setDraft(null)}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}