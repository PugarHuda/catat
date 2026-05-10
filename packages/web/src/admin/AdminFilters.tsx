import type { AdminFilters as Filters, Status, SortKey } from './types';
import { statusMeta, statusOrder } from './statusMeta';

interface Props {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  totalShown: number;
  totalAll: number;
}

const SORT_LABELS: Record<SortKey, string> = {
  latest: 'latest first',
  oldest: 'oldest first',
  severity: 'by severity',
  priority: 'by priority',
};

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
    <div className="adm-filters">
      <span className="count-pill">
        {totalShown} of {totalAll} shown
      </span>

      <span className="group-label">status</span>
      {statusOrder.map(s => {
        const m = statusMeta[s];
        const active = filters.status.has(s);
        return (
          <button
            key={s}
            type="button"
            className={`filter-chip${active ? ' on' : ''}`}
            onClick={() => toggleStatus(s)}
          >
            {m.label}
          </button>
        );
      })}

      <span className="group-label" style={{ marginLeft: 8 }}>severity</span>
      {SEVERITIES.map(sev => {
        const active = filters.severity.has(sev);
        return (
          <button
            key={sev}
            type="button"
            className={`filter-chip${active ? ' on' : ''}`}
            onClick={() => toggleSeverity(sev)}
          >
            {sev}
          </button>
        );
      })}

      <button
        type="button"
        className={`filter-chip${filters.encryptedOnly ? ' on green' : ''}`}
        onClick={() => onFiltersChange({ ...filters, encryptedOnly: !filters.encryptedOnly })}
        style={{ marginLeft: 8 }}
      >
        🔒 sealed only
      </button>

      {hasFilters && (
        <button
          type="button"
          className="filter-chip clear"
          onClick={() =>
            onFiltersChange({
              status: new Set(),
              severity: new Set(),
              encryptedOnly: false,
            })
          }
        >
          ✕ clear
        </button>
      )}

      <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span className="group-label">sort</span>
        <select
          value={sort}
          onChange={e => onSortChange(e.target.value as SortKey)}
          style={{
            fontFamily: 'var(--hand)', fontSize: 18,
            color: 'var(--ink)', background: 'var(--paper)',
            border: '1.5px solid var(--ink)', borderRadius: 6,
            padding: '2px 8px', cursor: 'pointer',
            boxShadow: '2px 2px 0 var(--ink)',
          }}
        >
          {(Object.entries(SORT_LABELS) as Array<[SortKey, string]>).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
      </span>
    </div>
  );
}
