import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { FormSchema } from '../builder/types';
import type { Submission, Status, AdminFilters as Filters, SortKey } from './types';
import AdminFilters from './AdminFilters';
import AdminTable from './AdminTable';
import AdminDetail from './AdminDetail';
import { useRealSubmissions } from './useRealSubmissions';
import SurfaceTabs from '@/components/SurfaceTabs';
import WalletButton from '@/components/WalletButton';
import BrandGlyph from '@/components/BrandGlyph';
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

  const realQuery = useRealSubmissions();
  const realSubmissions = realQuery.data ?? [];

  const allSubmissions = useMemo(
    () => [...realSubmissions, ...submissions],
    [realSubmissions, submissions],
  );

  const filtered = useMemo(() => {
    let rows = allSubmissions;

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
  }, [allSubmissions, filters, sort]);

  const updateSubmission = (id: string, patch: Partial<Submission>) => {
    onSubmissionsChange(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const inEditable =
        t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable;

      if (e.key === 'Escape' && openId) {
        e.preventDefault();
        setOpenId(null);
        return;
      }
      if (inEditable) return;

      if (openId) {
        if (e.key === 'y') { e.preventDefault(); updateSubmission(openId, { status: 'resolved' }); }
        else if (e.key === 'x') { e.preventDefault(); updateSubmission(openId, { status: 'archived' }); }
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
    total: allSubmissions.length,
    real: realSubmissions.length,
    mock: submissions.length,
    sealed: allSubmissions.filter(hasEncryptedField).length,
    new: allSubmissions.filter(s => s.status === 'new').length,
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

  const openSubmission = openId ? allSubmissions.find(s => s.id === openId) ?? null : null;

  return (
    <>
      <header className="nav">
        <div className="wrap nav-row">
          <button type="button" onClick={onHome} className="brand" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
            <BrandGlyph />
            catat
            <small>· inbox</small>
          </button>
          <SurfaceTabs current={surface} onChange={onSurfaceChange} count={{ admin: counts.total }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="sheet">
          <div className="sheet-head">
            <span>Inbox · responses ledger</span>
            <span className="date">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h1 style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1, margin: '0 0 8px', color: 'var(--ink)' }}>
            The <span className="marker">ledger.</span>
          </h1>
          <p style={{ fontFamily: 'var(--body)', fontSize: 18, color: 'var(--ink-soft)', margin: '0 0 22px', maxWidth: '60ch' }}>
            Every reply has an on-chain receipt. Sealed fields stay encrypted — click decrypt to fetch the Seal share with your wallet.
          </p>

          <div className="adm-stats">
            <div className="stat">
              <div className="label">replies</div>
              <b>{counts.total}</b>
              <small>{counts.real} on-chain · {counts.mock} demo</small>
            </div>
            <div className="stat">
              <div className="label">sealed</div>
              <b>{counts.sealed}</b>
              <small>2-of-3 keys</small>
            </div>
            <div className="stat">
              <div className="label">new</div>
              <b>{counts.new}</b>
              <small>not triaged yet</small>
            </div>
            <div className="stat">
              <div className="label">storage</div>
              <b>10 ep</b>
              <small>per submission</small>
            </div>
          </div>

          <AdminFilters
            filters={filters}
            onFiltersChange={setFilters}
            sort={sort}
            onSortChange={setSort}
            totalShown={filtered.length}
            totalAll={counts.total}
          />

          <div style={{ display: 'flex', gap: 8, marginBottom: 14, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" className="export-btn-paper" onClick={() => realQuery.refetch()} disabled={realQuery.isFetching}>
              {realQuery.isFetching ? '⟳ refreshing…' : '⟳ refresh chain'}
            </button>
            <button type="button" className="export-btn-paper" onClick={handleExport}>
              ⬇ export CSV
            </button>
          </div>

          <div className="admin-grid">
            <AdminTable
              submissions={filtered}
              focusedId={focusedId}
              openId={openId}
              onFocus={setFocusedId}
              onOpen={setOpenId}
            />

            {openSubmission && (
              <AdminDetail
                schema={schema}
                submission={openSubmission}
                onUpdate={patch => updateSubmission(openSubmission.id, patch)}
                onClose={() => setOpenId(null)}
              />
            )}
          </div>

          <p style={{
            marginTop: 22, textAlign: 'center',
            fontFamily: 'var(--type)', fontSize: 11, color: 'var(--pencil)',
            letterSpacing: '.06em',
          }}>
            keyboard ·{' '}
            <kbd style={{ fontFamily: 'var(--mono)', background: 'var(--paper-edge)', padding: '1px 4px', borderRadius: 3 }}>j</kbd>{' '}
            <kbd style={{ fontFamily: 'var(--mono)', background: 'var(--paper-edge)', padding: '1px 4px', borderRadius: 3 }}>k</kbd> nav ·{' '}
            <kbd style={{ fontFamily: 'var(--mono)', background: 'var(--paper-edge)', padding: '1px 4px', borderRadius: 3 }}>↵</kbd> open ·{' '}
            <kbd style={{ fontFamily: 'var(--mono)', background: 'var(--paper-edge)', padding: '1px 4px', borderRadius: 3 }}>y</kbd> resolve ·{' '}
            <kbd style={{ fontFamily: 'var(--mono)', background: 'var(--paper-edge)', padding: '1px 4px', borderRadius: 3 }}>x</kbd> archive ·{' '}
            <kbd style={{ fontFamily: 'var(--mono)', background: 'var(--paper-edge)', padding: '1px 4px', borderRadius: 3 }}>esc</kbd> close
          </p>
        </div>
      </div>
    </>
  );
}

function exportToCsv(schema: FormSchema, submissions: Submission[]): string {
  const fieldHeaders = schema.fields.map(f => (f.encrypted ? `${f.label} [encrypted]` : f.label));
  const headers = ['id', 'status', 'priority', 'submitted_at_iso', 'submitter', 'blob_id', 'tx_hash', 'source', ...fieldHeaders];
  const rows = submissions.map(s => {
    const meta = [
      s.id,
      s.status,
      s.priority,
      new Date(s.submitted_at_ms).toISOString(),
      s.submitter ?? '',
      s.blob_id,
      s.tx_hash,
      s.source ?? 'mock',
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
