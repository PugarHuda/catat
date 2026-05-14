import { useInboxFeed, type InboxFeedEntry } from '@/lib/useInboxFeed';
import { suiscanObject } from '@/lib/contract';
import SurfaceTabs from '@/components/SurfaceTabs';
import WalletButton from '@/components/WalletButton';
import BrandGlyph from '@/components/BrandGlyph';
import type { Surface } from '@/lib/surfaces';
import { useCurrentAccount } from '@mysten/dapp-kit';

interface Props {
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  /** Click on a feed row jumps to Admin scoped to that form. */
  onOpenInAdmin: (formId: string) => void;
  onHome?: () => void;
}

/**
 * Lightweight notification feed across ALL owned forms. Pure summary
 * (no per-submission blob fetching here) — count + latest activity per
 * form. User clicks a row → Admin surface opens with that form active.
 */
export default function InboxSurface({ surface, onSurfaceChange, onOpenInAdmin, onHome }: Props) {
  const account = useCurrentAccount();
  const feedQuery = useInboxFeed();
  const entries = feedQuery.data ?? [];
  const newCount = entries.reduce((sum, e) => sum + e.submissionCount, 0);

  return (
    <>
      <header className="nav">
        <div className="wrap nav-row">
          <button type="button" onClick={onHome} className="brand" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
            <BrandGlyph />
            catat
            <small>· inbox</small>
          </button>
          <SurfaceTabs current={surface} onChange={onSurfaceChange} count={{ inbox: newCount }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="sheet">
          <div className="sheet-head">
            <span>Inbox · notification feed</span>
            <span className="date">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h1 style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1, margin: '0 0 8px', color: 'var(--ink)' }}>
            Your <span className="marker">activity feed.</span>
          </h1>
          <p style={{ fontFamily: 'var(--body)', fontSize: 18, color: 'var(--ink-soft)', margin: '0 0 22px', maxWidth: '60ch' }}>
            One line per form. Click a form to drill into <b>Admin</b> for triage,
            decrypt, filters, and exports.
          </p>

          {!account && (
            <div className="seed-form-banner">
              <b>👀 connect wallet to see your feed</b>
              <span>The inbox queries Sui events filtered by forms owned by your wallet address.</span>
            </div>
          )}

          {feedQuery.isLoading && (
            <div className="adm-empty">⟳ loading feed from chain…</div>
          )}

          {feedQuery.isError && (
            <div className="seed-form-banner err">
              <b>⚠ couldn't load feed</b>
              <span>{(feedQuery.error as Error).message.slice(0, 200)}</span>
            </div>
          )}

          {account && !feedQuery.isLoading && entries.length === 0 && (
            <div className="adm-empty">
              No forms yet.
              <small>publish a form via Builder; activity appears here as respondents fill the share URL.</small>
            </div>
          )}

          {entries.length > 0 && (
            <div className="inbox-feed">
              {entries.map(entry => (
                <FeedRow key={entry.formId} entry={entry} onOpen={() => onOpenInAdmin(entry.formId)} />
              ))}
            </div>
          )}

          <p style={{ marginTop: 22, textAlign: 'center', fontFamily: 'var(--type)', fontSize: 11, color: 'var(--pencil)', letterSpacing: '.06em' }}>
            feed sourced from <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>catat::form::SubmissionAdded</code> Sui events · refreshed every 30s
          </p>
        </div>
      </div>
    </>
  );
}

function FeedRow({ entry, onOpen }: { entry: InboxFeedEntry; onOpen: () => void }) {
  const submitterAlias = entry.latestSubmitter
    ? `${entry.latestSubmitter.slice(0, 6)}…${entry.latestSubmitter.slice(-4)}`
    : null;
  const hasActivity = entry.submissionCount > 0;

  return (
    <div className={`feed-row${hasActivity ? ' has-activity' : ' is-empty'}`}>
      <div className="fr-icon">{hasActivity ? '📥' : '📭'}</div>
      <div className="fr-body">
        <div className="fr-title">{entry.formTitle}</div>
        <div className="fr-meta">
          {hasActivity ? (
            <>
              <b>{entry.submissionCount}</b> submission{entry.submissionCount === 1 ? '' : 's'} ·{' '}
              latest {timeAgo(entry.latestSubmittedAtMs)}
              {submitterAlias && <> · by <code>{submitterAlias}</code></>}
            </>
          ) : (
            <>no activity yet · created {timeAgo(entry.latestSubmittedAtMs)}</>
          )}
        </div>
      </div>
      <div className="fr-actions">
        <button type="button" className="btn btn-sm btn-primary" onClick={onOpen}>
          {hasActivity ? 'Triage in Admin →' : 'Open in Admin →'}
        </button>
        <a
          href={suiscanObject(entry.formId)}
          target="_blank"
          rel="noopener noreferrer"
          className="fr-suiscan"
          title="View Form object on Suiscan"
        >
          ↗ chain
        </a>
      </div>
    </div>
  );
}

function timeAgo(ts: number): string {
  if (!ts) return 'unknown';
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
