import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EmptyState from '@/components/EmptyState';
import { cn } from '@/lib/utils';

const ALL = '__all__';

export default function TablePanel({
  title,
  search,
  onSearchChange,
  searchPlaceholder = 'Rechercher…',
  filters = [],
  actions,
  columns = [],
  rows = [],
  loading,
  error,
  onRowClick,
  empty,
  footer,
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-border bg-card">
      {(title || onSearchChange || filters.length > 0 || actions) && (
      <div className="flex flex-col gap-2 border-b border-border/70 p-3 sm:flex-row sm:items-center sm:gap-2.5">
        {title && (
          <span className="shrink-0 px-1 font-heading text-[13px] font-semibold text-foreground">
            {title}
          </span>
        )}
        {onSearchChange && (
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 border-border/80 bg-background pl-9 text-[13px]"
            />
          </div>
        )}

        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={filter.value || ALL}
            onValueChange={(next) => filter.onChange(next === ALL ? '' : next)}
          >
            <SelectTrigger className="h-9 w-full text-[13px] sm:w-[172px]">
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{filter.allLabel || 'Tous'}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      )}

      {error && (
        <p className="border-b border-border/70 bg-destructive/5 px-4 py-2.5 text-[12.5px] text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="h-11 animate-pulse rounded-lg bg-secondary/60" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={empty?.icon}
          title={empty?.title || 'Aucun enregistrement'}
          description={empty?.description}
          action={empty?.action}
        />
      ) : (
        <div className="overflow-x-auto thin-scroll">
          <Table>
            <TableHeader>
              <TableRow className="border-border/70 hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      'h-9 whitespace-nowrap px-4 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground',
                      column.className,
                    )}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-border/60',
                    onRowClick && 'cursor-pointer hover:bg-secondary/40',
                  )}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={cn('px-4 py-3 text-[13px]', column.className)}>
                      {column.render ? column.render(row) : row[column.key] ?? '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {footer && <div className="border-t border-border/70 px-4 py-2.5">{footer}</div>}
    </section>
  );
}