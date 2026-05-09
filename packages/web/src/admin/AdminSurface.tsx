import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Download } from 'lucide-react';
import type { FormSchema } from '../builder/types';
import type { Submission, Status, AdminFilters as Filters, SortKey } from './types';
import AdminFilters from './AdminFilters';
import AdminTable from './AdminTable';
import AdminDetail from './AdminDetail';
import SurfaceTabs from '@/components/SurfaceTabs';
import type { Surface } from '@/lib/surfaces';

interface Props {
  schema: FormSchema;
  submissions: Submission[];
  onSubmissionsChange: Dispatch<SetStateAction<Submission[]>>;
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  onHome?: () => void;
}

const SEVERITY_WEIGHT: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
const PRIORITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };

function severityWeight(s: Submission): number {
  return SEVERITY_WEIGHT[(s.values.f_severity as string) ?? ''] ?? 0;
}

function priorityWeight(s: Submission): number {
  return PRIORITY_WEIGHT[s.priority] ?? 0;
}

function hasEncryptedField(s: Submission): boolean {
  return Object.values(s.values).some(
    v => v != null && typeof v === 'object' && (v as { encrypted?: boolean }).encrypted === true,
  );
}

export default function AdminSurface({ schema, submissions, onSubmissionsChange, surface, onSurfaceChange, onHome }: Props) {
  const [filters, setFilters] = useState<Filters>({
    status: new Set<Status>(),
    severity: new Set<string>(),
    encryptedOnly: false,
  });
  const [sort, setSort] = useState<SortKey>('latest');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let rows = submissions;

    if (filters.status.size > 0) {
      rows = rows.filter(r => filters.status.has(r.status));
    }
    if (filters.severity.size > 0) {
      rows = rows.filter(r => filters.severity.has((r.values.f_severity as string) ?? ''));
    }
    if (filters.encryptedOnly) {
      rows = rows.filter(hasEncryptedField);
    }

    return [...rows].sort((a, b) => {
      switch (sort) {
        case 'latest':   return b.submitted_at_ms - a.submitted_at_ms;
        case 'oldest':   return a.submitted_at_ms - b.submitted_at_ms;
        case 'severity': return severityWeight(b) - severityWeight(a);
        case 'priority': return priorityWeight(b) - priorityWeight(a);
      }
    });
  }, [submissions, filters, sort]);

  const updateSubmission = (id: string, patch: Partial<Submission>) => {
    onSubmissionsChange(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const inEditable =
        t.tagName === 'INPUT' ||
        t.tagName === 'TEXTAREA' ||
        t.tagName === 'SELECT' ||
        t.isContentEditable;

      if (e.key === 'Escape' && openId) {
        e.preventDefault();
        setOpenId(null);
        return;
      }

      if (inEditable) return;

      if (openId) {
        if (e.key === 'y') {
          e.preventDefault();
          updateSubmission(openId, { status: 'resolved' });
        } else if (e.key === 'x') {
          e.preventDefault();
          updateSubmission(openId, { status: 'archived' });
        }
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const idx = filtered.findIndex(s => s.id === focusedId);
        const next = filtered[Math.min(idx + 1, filtered.length - 1)] ?? filtered[0];
        if (next) setFocusedId(next.id);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const idx = filtered.findIndex(s => s.id === focusedId);
        const next = filtered[Math.max(idx - 1, 0)] ?? filtered[0];
        if (next) setFocusedId(next.id);
      } else if (e.key === 'Enter' && focusedId) {
        e.preventDefault();
        setOpenId(focusedId);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, focusedId, openId]);

  const counts = {
    total: submissions.length,
    new: submissions.filter(s => s.status === 'new').length,
  };

  const handleExport = () => {
    const csv = exportToCsv(schema, filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catat-${schema.id}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openSubmission = openId ? submissions.find(s => s.id === openId) ?? null : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-3 px-6 text-sm">
          <button
            type="button"
            onClick={onHome}
            className="font-mono text-foreground transition hover:text-muted-foreground"
            title="Back to landing"
          >
            catat
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="min-w-0 flex-1 truncate font-medium">{schema.title}</span>
          <SurfaceTabs current={surface} onChange={onSurfaceChange} count={{ admin: counts.total }} />
          <span className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-block">
            testnet
          </span>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <AdminFilters
            filters={filters}
            onFiltersChange={setFilters}
            sort={sort}
            onSortChange={setSort}
            totalShown={filtered.length}
            totalAll={counts.total}
          />
          <AdminTable
            submissions={filtered}
            focusedId={focusedId}
            openId={openId}
            onFocus={setFocusedId}
            onOpen={setOpenId}
          />
        </div>

        {openSubmission && (
          <AdminDetail
            schema={schema}
            submission={openSubmission}
            onUpdate={patch => updateSubmission(openSubmission.id, patch)}
            onClose={() => setOpenId(null)}
          />
        )}
      </main>

      <p className="pb-8 text-center font-mono text-[11px] text-muted-foreground/60">
        prototype · {filtered.length} of {counts.total} shown · keyboard:{' '}
        <kbd className="rounded border border-border bg-muted px-1">j</kbd>{' '}
        <kbd className="rounded border border-border bg-muted px-1">k</kbd> nav ·{' '}
        <kbd className="rounded border border-border bg-muted px-1">↵</kbd> open ·{' '}
        <kbd className="rounded border border-border bg-muted px-1">y</kbd> resolve ·{' '}
        <kbd className="rounded border border-border bg-muted px-1">x</kbd> archive ·{' '}
        <kbd className="rounded border border-border bg-muted px-1">esc</kbd> close
      </p>
    </div>
  );
}

function exportToCsv(schema: FormSchema, submissions: Submission[]): string {
  const fieldHeaders = schema.fields.map(f => (f.encrypted ? `${f.label} [encrypted]` : f.label));
  const headers = [
    'id',
    'status',
    'priority',
    'submitted_at_iso',
    'submitter',
    'blob_id',
    'tx_hash',
    ...fieldHeaders,
  ];

  const rows = submissions.map(s => {
    const meta = [
      s.id,
      s.status,
      s.priority,
      new Date(s.submitted_at_ms).toISOString(),
      s.submitter ?? '',
      s.blob_id,
      s.tx_hash,
    ];
    const fieldValues = schema.fields.map(f => {
      const v = s.values[f.id];
      if (f.encrypted) return '[encrypted]';
      if (v == null) return '';
      if (Array.isArray(v))
        return v
          .map(item => (typeof item === 'object' && item !== null && 'filename' in item ? (item as { filename: string }).filename : String(item)))
          .join('; ');
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    });
    return [...meta, ...fieldValues];
  });

  return [headers, ...rows].map(row => row.map(escapeCsvCell).join(',')).join('\n');
}

function escapeCsvCell(cell: unknown): string {
  if (cell == null) return '';
  const s = String(cell);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
