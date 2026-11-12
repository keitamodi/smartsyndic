import { Link } from 'react-router-dom';
import { Bell, CalendarClock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import useCollection from '@/hooks/useCollection';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { formatDate, relativeTime } from '@/lib/format';

export default function NotificationsMenu() {
  const { syndicId } = useWorkspace();
  const { items: notifications, reload } = useCollection(
    'Notification',
    { syndic_id: syndicId },
    { enabled: !!syndicId, limit: 20 },
  );
  const { items: appointments } = useCollection(
    'Appointment',
    { syndic_id: syndicId },
    { enabled: !!syndicId, limit: 40 },
  );

  const unread = notifications.filter((item) => !item.read);
  const today = new Date(new Date().toDateString());
  const upcoming = appointments
    .filter((item) => item.status !== 'annule' && item.date && new Date(item.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  const markRead = async (notification) => {
    if (notification.read) return;
    await base44.entities.Notification.update(notification.id, { read: true });
    await reload();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
          {unread.length > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] text-primary-foreground">
              {unread.length > 9 ? '9+' : unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Notifications</p>
          <span className="font-mono text-[10px] text-muted-foreground">{unread.length} non lue(s)</span>
        </div>

        <div className="thin-scroll max-h-[260px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">
              Aucune notification pour le moment.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {notifications.slice(0, 12).map((notification) => (
                <li key={notification.id}>
                  <Link
                    to={notification.link || '/tickets'}
                    onClick={() => markRead(notification)}
                    className="block px-4 py-2.5 transition-colors hover:bg-secondary/40"
                  >
                    <div className="flex items-start gap-2">
                      {!notification.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-medium text-foreground">{notification.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground/80">
                          {relativeTime(notification.created_date)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border/70 px-4 py-2.5">
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
            Prochains rendez-vous
          </p>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-[12px] text-muted-foreground">Aucun rendez-vous planifié.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {upcoming.map((appointment) => (
                <li key={appointment.id} className="flex items-baseline justify-between gap-2 text-[12px]">
                  <span className="min-w-0 truncate text-foreground/80">{appointment.title}</span>
                  <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">
                    {formatDate(appointment.date)}
                    {appointment.start_time ? ` · ${appointment.start_time}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}