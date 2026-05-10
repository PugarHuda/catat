import type { Submission } from './types';

interface Props {
  submissions: Submission[];
  focusedId: string | null;
  openId: string | null;
  onFocus: (id: string) => void;
  onOpen: (id: string) => void;
}

export default function AdminTable({ submissions, openId, onFocus, onOpen }: Props) {
  if (submissions.length === 0) {
    return (
      <div className="ledger">
        <div className="ledger-h">
          <h4>Recent submissions</h4>
        </div>
        <div className="adm-empty">
          No submissions match these filters.
          <small>adjust the chips above, or hit ✕ clear</small>
        </div>
      </div>
    );
  }

  return (
    <div className="ledger">
      <div className="ledger-h">
        <h4>Recent submissions</h4>
        <span className="filter">{submissions.length} shown · click row to inspect</span>
      </div>
      <div className="ledger-row head">
        <span>#</span>
        <span>respondent</span>
        <span>tx</span>
        <span>sev</span>
        <span>when</span>
      </div>
      {submissions.map((s, i) => {
        const sev = (s.values.f_severity as string | undefined)?.toLowerCase() ?? '';
        const title = (s.values.f_title as string | undefined) ?? '(no title)';
        const isOpen = openId === s.id;
        const submitterAlias = s.submitter
          ? `${s.submitter.slice(0, 6)}…${s.submitter.slice(-4)}`
          : 'anonymous';
        const txShort = s.tx_hash
          ? `${s.tx_hash.slice(0, 8)}…`
          : `${s.blob_id.slice(0, 8)}…`;

        return (
          <button
            key={s.id}
            type="button"
            className={`ledger-row${isOpen ? ' selected' : ''}`}
            onClick={() => {
              onFocus(s.id);
              onOpen(s.id);
            }}
          >
            <span className="lr-id">
              {s.source === 'walrus' && <span className="lr-source-dot" title="Real on-chain submission" />}
              #{i + 1}
            </span>
            <span className="lr-who">
              <b>{title}</b>
              <small>{submitterAlias}{s.source === 'walrus' && ' · live'}</small>
            </span>
            <span className="lr-tx">{txShort}</span>
            <span className={`lr-sev ${sev}`}>{sev || '—'}</span>
            <span className="lr-when">{timeAgo(s.submitted_at_ms)}</span>
          </button>
        );
      })}
    </div>
  );
}

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
