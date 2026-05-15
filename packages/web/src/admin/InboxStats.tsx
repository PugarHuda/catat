import { useMemo } from 'react';
import type { Submission, Status } from './types';

interface Props {
  submissions: Submission[];
  /** Whether the active schema has a `f_severity` field — controls
   *  whether the Severity breakdown is shown. NPS / Contact / etc.
   *  forms don't have severity, so hide the chart there. */
  hasSeverityField: boolean;
}

/**
 * Compact admin stats — sparkline of submissions over last 7 days + per
 * status bars + (optional) severity bars. SVG hand-drawn to match
 * paper aesthetic; no chart library dependency.
 */
export default function InboxStats({ submissions: rawSubmissions, hasSeverityField }: Props) {
  // Drop placeholder rows (failed-blob synth entries) so charts reflect
  // real data only — a Walrus relay outage shouldn't add a fake spike to
  // the sparkline or move the status/severity bars.
  const submissions = useMemo(() => rawSubmissions.filter(s => !s._isPlaceholder), [rawSubmissions]);

  // ─── Sparkline data: bucket submissions into the last 7 days ───────
  const buckets = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const out = Array.from({ length: 7 }, (_, i) => ({
      // i=0 is 6 days ago, i=6 is today
      label: i === 6 ? 'today' : `${6 - i}d`,
      count: 0,
    }));
    for (const s of submissions) {
      const ageDays = Math.floor((now - s.submitted_at_ms) / dayMs);
      const idx = 6 - ageDays;
      if (idx >= 0 && idx < 7) out[idx]!.count += 1;
    }
    return out;
  }, [submissions]);
  const maxCount = Math.max(1, ...buckets.map(b => b.count));

  // ─── Status breakdown ───────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<Status | 'other', number> = {
      new: 0, triaging: 0, in_progress: 0, resolved: 0, archived: 0,
      // Catch-all for future Status enum additions or tampered overlay
      // values — without this, % bars wouldn't sum to 100 and unknown
      // values would invisibly disappear.
      other: 0,
    };
    const knownStatuses = new Set<string>(['new', 'triaging', 'in_progress', 'resolved', 'archived']);
    for (const s of submissions) {
      if (knownStatuses.has(s.status)) {
        counts[s.status] = (counts[s.status] ?? 0) + 1;
      } else {
        counts.other += 1;
        if (counts.other === 1) console.warn(`[stats] unknown status "${s.status}" — bucketing as 'other'`);
      }
    }
    return counts;
  }, [submissions]);

  // ─── Severity breakdown (bug-report shape only) ────────────────────
  const severityCounts = useMemo(() => {
    if (!hasSeverityField) return null;
    const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const s of submissions) {
      const sev = s.values.f_severity as string | undefined;
      if (sev && sev in counts) counts[sev] = (counts[sev] ?? 0) + 1;
    }
    return counts;
  }, [submissions, hasSeverityField]);

  if (submissions.length === 0) return null;

  return (
    <div className="inbox-stats">
      {/* sparkline — readable bigger sizes, day labels below */}
      <div className="ix-block ix-spark">
        <div className="ix-h">
          <b>{submissions.length}</b>
          <span>submissions · last 7 days</span>
        </div>
        <svg viewBox="0 0 360 100" className="ix-spark-svg" preserveAspectRatio="xMidYMid meet">
          {/* baseline */}
          <line x1="4" y1="76" x2="356" y2="76" stroke="var(--line)" strokeWidth="1.2" strokeDasharray="3 4"/>
          {/* bars */}
          {buckets.map((b, i) => {
            const barW = 38;
            const gap = 12;
            const x = 12 + i * (barW + gap);
            const h = b.count === 0 ? 3 : (b.count / maxCount) * 62;
            const y = 76 - h;
            const isToday = i === 6;
            return (
              <g key={i}>
                <rect
                  x={x} y={y} width={barW} height={h}
                  fill="var(--marker-blue)"
                  opacity={isToday ? 1 : 0.55}
                  rx="3"
                />
                {b.count > 0 && (
                  <text
                    x={x + barW / 2} y={y - 5}
                    textAnchor="middle"
                    fill="var(--ink)"
                    fontSize="14"
                    fontWeight="700"
                    fontFamily="var(--mono)"
                  >
                    {b.count}
                  </text>
                )}
                <text
                  x={x + barW / 2} y={92}
                  textAnchor="middle"
                  fill={isToday ? 'var(--marker-blue)' : 'var(--pencil)'}
                  fontSize="11"
                  fontWeight={isToday ? '700' : '400'}
                  fontFamily="var(--type)"
                  letterSpacing="0.05em"
                >
                  {b.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* status breakdown */}
      <div className="ix-block ix-status">
        <div className="ix-h">
          <span>by status</span>
        </div>
        <div className="ix-bars">
          {(Object.entries(statusCounts) as Array<[Status, number]>).map(([status, count]) => (
            <StatusBar key={status} label={status} count={count} total={submissions.length} />
          ))}
        </div>
      </div>

      {/* severity breakdown (conditional) */}
      {severityCounts && (
        <div className="ix-block ix-sev">
          <div className="ix-h">
            <span>by severity</span>
          </div>
          <div className="ix-bars">
            {(['Critical', 'High', 'Medium', 'Low'] as const).map(sev => (
              <SeverityBar
                key={sev}
                label={sev}
                count={severityCounts[sev] ?? 0}
                total={submissions.length}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBar({ label, count, total }: { label: Status; count: number; total: number }) {
  const pct = total === 0 ? 0 : (count / total) * 100;
  return (
    <div className="ix-bar-row">
      <span className="ix-bar-label">{label}</span>
      <div className="ix-bar-track">
        <div
          className={`ix-bar-fill status-${label}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <span className="ix-bar-count">{count}</span>
    </div>
  );
}

function SeverityBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total === 0 ? 0 : (count / total) * 100;
  return (
    <div className="ix-bar-row">
      <span className="ix-bar-label">{label.toLowerCase()}</span>
      <div className="ix-bar-track">
        <div
          className={`ix-bar-fill sev-${label.toLowerCase()}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <span className="ix-bar-count">{count}</span>
    </div>
  );
}
