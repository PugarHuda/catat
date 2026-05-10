import { Lock, Star } from 'lucide-react';
import type { Submission } from './types';
import { statusMeta } from './statusMeta';
import { cn } from '@/lib/utils';

interface Props {
  submissions: Submission[];
  focusedId: string | null;
  openId: string | null;
  onFocus: (id: string) => void;
  onOpen: (id: string) => void;
}

export default function AdminTable({ submissions, focusedId, openId, onFocus, onOpen }: Props) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">No submissions match these filters.</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground/60">
          Adjust filter chips above, or use Clear to reset.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="w-7 py-2 pl-3 pr-1"></th>
            <th className="py-2 pr-2 text-left font-medium">Status</th>
            <th className="py-2 pr-2 text-left font-medium">Severity</th>
            <th className="py-2 pr-2 text-left font-medium">Title</th>
            <th className="hidden py-2 pr-2 text-left font-medium md:table-cell">Submitter</th>
            <th className="hidden py-2 pr-2 text-left font-medium lg:table-cell">Rating</th>
            <th className="py-2 pr-3 text-right font-medium">Age</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map(s => {
            const isFocused = focusedId === s.id;
            const isOpen = openId === s.id;
            const status = statusMeta[s.status];
            const StatusIcon = status.icon;
            const sev = s.values.f_severity as string | undefined;
            const title = s.values.f_title as string | undefined;
            const rating = s.values.f_rating as number | undefined | null;
            const hasEncrypted = Object.values(s.values).some(
              v => v != null && typeof v === 'object' && (v as { encrypted?: boolean }).encrypted === true,
            );

            return (
              <tr
                key={s.id}
                onClick={() => {
                  onFocus(s.id);
                  onOpen(s.id);
                }}
                className={cn(
                  'cursor-pointer border-b border-border/60 transition last:border-0',
                  isOpen
                    ? 'bg-accent/60'
                    : isFocused
                      ? 'bg-muted/40'
                      : 'hover:bg-muted/30',
                )}
              >
                <td className="py-2.5 pl-3 pr-1">
                  {s.source === 'walrus' ? (
                    <span
                      className="relative flex h-1.5 w-1.5"
                      title="Real on-chain submission read from Walrus"
                    >
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                  ) : hasEncrypted ? (
                    <Lock className="h-3 w-3 text-emerald-600" />
                  ) : null}
                </td>
                <td className="py-2.5 pr-2">
                  <span className={cn('inline-flex items-center gap-1.5 text-xs', status.color)}>
                    <StatusIcon className="h-3 w-3" />
                    <span>{status.label}</span>
                  </span>
                </td>
                <td className="py-2.5 pr-2">{sev && <SeverityBadge severity={sev} />}</td>
                <td className="py-2.5 pr-2">
                  <span className="line-clamp-1 text-foreground">
                    {title || <span className="italic text-muted-foreground">(no title)</span>}
                  </span>
                </td>
                <td className="hidden py-2.5 pr-2 md:table-cell">
                  {s.submitter ? (
                    <span className="font-mono text-xs text-muted-foreground">{shorten(s.submitter)}</span>
                  ) : (
                    <span className="text-xs italic text-muted-foreground/60">anonymous</span>
                  )}
                </td>
                <td className="hidden py-2.5 pr-2 lg:table-cell">
                  {rating != null && rating > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-yellow-600">
                      <Star className="h-3 w-3 fill-current" /> {rating}
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-right font-mono text-xs text-muted-foreground">
                  {timeAgo(s.submitted_at_ms)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    Critical: 'bg-red-500/10 text-red-700',
    High:     'bg-orange-500/10 text-orange-700',
    Medium:   'bg-amber-500/10 text-amber-700',
    Low:      'bg-blue-500/10 text-blue-700',
  };
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        colors[severity] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {severity}
    </span>
  );
}

function shorten(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d`;
  const mo = Math.floor(day / 30);
  return `${mo}mo`;
}
