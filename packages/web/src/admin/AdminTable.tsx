import { useState } from 'react';
import type { Submission } from './types';

interface Props {
  submissions: Submission[];
  /** Total (pre-filter) submission count, so we can show a different
   *  empty state for "no submissions at all yet" vs "all filtered out". */
  totalUnfiltered: number;
  /** Share URL of the active form — shown in the truly-empty state so
   *  the publisher can copy and start collecting responses. */
  shareUrl: string;
  focusedId: string | null;
  openId: string | null;
  onFocus: (id: string) => void;
  onOpen: (id: string) => void;
}

export default function AdminTable({ submissions, totalUnfiltered, shareUrl, openId, onFocus, onOpen }: Props) {
  if (submissions.length === 0) {
    // Distinguish empty-because-filtered vs empty-because-no-submissions.
    if (totalUnfiltered === 0) {
      return (
        <div className="ledger">
          <div className="ledger-h">
            <h4>Recent submissions</h4>
          </div>
          <EmptyInbox shareUrl={shareUrl} />
        </div>
      );
    }
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

/** Shown when there are zero submissions for this form yet — guide the
 *  publisher to share the URL so respondents can start filling it. */
function EmptyInbox({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.warn('clipboard write blocked:', err);
      alert(`Copy this URL manually:\n\n${shareUrl}`);
    }
  };
  return (
    <div className="inbox-empty">
      <div className="ie-illu">📬</div>
      <h5>No submissions yet.</h5>
      <p>
        Your inbox is plugged into the Walrus blob list on the on-chain Form
        object. As soon as anyone fills the share URL, their reply appears
        here in real-time.
      </p>
      <div className="ie-share">
        <code>{shareUrl}</code>
        <button type="button" className="btn btn-sm btn-primary" onClick={copy}>
          {copied ? '✓ copied' : 'Copy share URL'}
        </button>
        <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
          Open ↗
        </a>
      </div>
      <small className="ie-hint">
        Tip: hit ⟳ refresh chain above to re-query Sui RPC if you just submitted.
      </small>
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
