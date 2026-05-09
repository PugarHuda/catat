import { ChevronDown, Lock } from 'lucide-react';
import type { AdminFilters as Filters, Status, SortKey } from './types';
import { statusMeta, statusOrder } from './statusMeta';
import { cn } from '@/lib/utils';

interface Props {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  totalShown: number;
  totalAll: number;
}

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'latest',   label: 'Latest first' },
  { value: 'oldest',   label: 'Oldest first' },
  { value: 'severity', label: 'Severity' },
  { value: 'priority', label: 'Priority' },
];

const SEVERITIES: Array<'Critical' | 'High' | 'Medium' | 'Low'> = ['Critical', 'High', 'Medium', 'Low'];

export default function AdminFilters({ filters, onFiltersChange, sort, onSortChange, totalShown, totalAll }: Props) {
  const toggleStatus = (s: Status) => {
    const next = new Set(filters.status);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    onFiltersChange({ ...filters, status: next });
  };

  const toggleSeverity = (sev: string) => {
    const next = new Set(filters.severity);
    if (next.has(sev)) next.delete(sev);
    else next.add(sev);
    onFiltersChange({ ...filters, severity: next });
  };

  const hasFilters = filters.status.size > 0 || filters.severity.size > 0 || filters.encryptedOnly;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="font-mono text-muted-foreground">
        {totalShown} of {totalAll}
      </span>
      <span className="text-muted-foreground/40">·</span>

      <span className="text-muted-foreground">Status</span>
      {statusOrder.map(s => {
        const m = statusMeta[s];
        const active = filters.status.has(s);
        const Icon = m.icon;
        return (
          <button
            key={s}
            type="button"
            onClick={() => toggleStatus(s)}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 transition',
              active
                ? 'border-foreground/40 bg-accent text-foreground'
                : 'border-border text-muted-foreground hover:bg-muted/50',
            )}
          >
            <Icon className={cn('h-3 w-3', active && m.color)} />
            {m.label}
          </button>
        );
      })}

      <span className="mx-1 text-muted-foreground/40">·</span>

      <span className="text-muted-foreground">Severity</span>
      {SEVERITIES.map(sev => {
        const active = filters.severity.has(sev);
        return (
          <button
            key={sev}
            type="button"
            onClick={() => toggleSeverity(sev)}
            className={cn(
              'rounded-md border px-1.5 py-0.5 transition',
              active
                ? 'border-foreground/40 bg-accent text-foreground'
                : 'border-border text-muted-foreground hover:bg-muted/50',
            )}
          >
            {sev}
          </button>
        );
      })}

      <span className="mx-1 text-muted-foreground/40">·</span>

      <button
        type="button"
        onClick={() => onFiltersChange({ ...filters, encryptedOnly: !filters.encryptedOnly })}
        className={cn(
          'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 transition',
          filters.encryptedOnly
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
            : 'border-border text-muted-foreground hover:bg-muted/50',
        )}
      >
        <Lock className="h-3 w-3" /> Encrypted
      </button>

      {hasFilters && (
        <button
          type="button"
          onClick={() =>
            onFiltersChange({
              status: new Set(),
              severity: new Set(),
              encryptedOnly: false,
            })
          }
          className="rounded-md px-1.5 py-0.5 text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <span className="text-muted-foreground">Sort</span>
        <div className="relative">
          <select
            value={sort}
            onChange={e => onSortChange(e.target.value as SortKey)}
            className="appearance-none rounded-md border border-border bg-background py-0.5 pl-2 pr-6 text-xs"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
