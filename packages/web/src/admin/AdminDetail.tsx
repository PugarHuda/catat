import { useState } from 'react';
import type { Field, FormSchema } from '../builder/types';
import type { Submission } from './types';
import { statusMeta, statusOrder } from './statusMeta';
import { suiscanObject, suiscanTx, walruscanBlob } from '@/lib/contract';
import type { SealedFieldMeta } from '@/lib/useSealDecrypt';

interface Props {
  schema: FormSchema;
  submission: Submission;
  /** Decrypt callback supplied by AdminSurface — its SessionKey ref outlives
   *  this panel's mount, so opening 5 rows = 1 wallet popup, not 5. */
  decrypt: (meta: SealedFieldMeta) => Promise<string>;
  onUpdate: (patch: Partial<Submission>) => void;
  onClose: () => void;
}

export default function AdminDetail({ schema, submission, decrypt, onUpdate, onClose }: Props) {
  const submittedAt = new Date(submission.submitted_at_ms);
  const submitterShort = submission.submitter
    ? `${submission.submitter.slice(0, 6)}…${submission.submitter.slice(-4)}`
    : 'anonymous';

  return (
    <aside className="detail">
      <div className="det-card">
        <h4>{(submission.values.f_title as string | undefined) ?? 'Untitled submission'}</h4>
        <div className="det-meta">
          {submission.id} · {submittedAt.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          {submission.source === 'walrus' && ' · LIVE'}
        </div>

        <div className="det-section">
          <div className="label">
            <span>status</span>
            <button type="button" onClick={onClose} style={{ fontFamily: 'var(--hand)', fontSize: 16, color: 'var(--marker-blue)', background: 'none', border: 0, cursor: 'pointer' }}>
              close ✕
            </button>
          </div>
          <div className="status-btns">
            {statusOrder.map(s => (
              <button
                key={s}
                type="button"
                className={`status-btn${submission.status === s ? ' on' : ''}`}
                onClick={() => onUpdate({ status: s })}
              >
                {statusMeta[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="det-section">
          <div className="label">
            <span>priority</span>
          </div>
          <div className="status-btns">
            {(['low', 'medium', 'high'] as const).map(p => (
              <button
                key={p}
                type="button"
                className={`status-btn${submission.priority === p ? ' on' : ''}`}
                onClick={() => onUpdate({ priority: p })}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="det-section">
          <div className="label">
            <span>triage notes</span>
            {submission.notes && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--pencil)' }}>{submission.notes.length} chars</span>}
          </div>
          <textarea
            className="det-notes"
            value={submission.notes ?? ''}
            placeholder="Private notes for the team — repro steps, who to assign, links to relevant code…"
            onChange={e => onUpdate({ notes: e.target.value })}
            rows={3}
            spellCheck
          />
          <small style={{ fontFamily: 'var(--body)', fontSize: 11, color: 'var(--pencil)', fontStyle: 'italic' }}>
            Notes stay in your browser session — never written to chain. Persistence to a Walrus admin blob is on the roadmap.
          </small>
        </div>

        {schema.fields.map((f, i) => {
          const v = submission.values[f.id];
          return (
            <div className="det-section" key={f.id}>
              <div className="label">
                <span>Q{i + 1} · {f.label}</span>
                {f.encrypted && (
                  <span className="lock-tag" style={{ transform: 'none' }}>
                    🔒 sealed
                  </span>
                )}
              </div>
              <FieldAnswer field={f} value={v} onDecrypt={decrypt} />
            </div>
          );
        })}

        <div className="det-section">
          <div className="label">proof</div>
          {submission.blob_id && (
            <div className="proof-row">
              <span>walrus blob</span>
              <a href={walruscanBlob(submission.blob_id)} target="_blank" rel="noopener noreferrer">
                {`${submission.blob_id.slice(0, 10)}…`}
              </a>
            </div>
          )}
          {submission.tx_hash && (
            <div className="proof-row">
              <span>sui tx</span>
              <a href={suiscanTx(submission.tx_hash)} target="_blank" rel="noopener noreferrer">
                {`${submission.tx_hash.slice(0, 10)}…`}
              </a>
            </div>
          )}
          {submission.submitter && (
            <div className="proof-row">
              <span>submitter</span>
              <a href={suiscanObject(submission.submitter)} target="_blank" rel="noopener noreferrer">
                {submitterShort}
              </a>
            </div>
          )}
          <div className="proof-row">
            <span>signature</span>
            <b>ed25519 ✓</b>
          </div>
          <div className="proof-row">
            <span>source</span>
            <b>{submission.source === 'walrus' ? 'on-chain (real)' : 'demo data'}</b>
          </div>

          <div className="det-actions">
            {submission.tx_hash && (
              <a className="btn btn-sm" href={suiscanTx(submission.tx_hash)} target="_blank" rel="noopener noreferrer">
                Sui ↗
              </a>
            )}
            {submission.blob_id && (
              <a className="btn btn-sm" href={walruscanBlob(submission.blob_id)} target="_blank" rel="noopener noreferrer">
                Walrus ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function FieldAnswer({
  field,
  value,
  onDecrypt,
}: {
  field: Field;
  value: unknown;
  onDecrypt: (meta: SealedFieldMeta) => Promise<string>;
}) {
  if (value == null || value === '') {
    return <div className="det-answer" style={{ color: 'var(--pencil-soft)', fontStyle: 'italic' }}>(empty)</div>;
  }

  if (typeof value === 'object' && value !== null && (value as { encrypted?: boolean }).encrypted) {
    const meta = value as Partial<SealedFieldMeta> & { ciphertext_placeholder?: string };
    // Old/demo data may lack the fields needed for real decrypt — fall back
    // to placeholder UI so the row still renders.
    const canDecrypt =
      typeof meta.packageId === 'string' &&
      typeof meta.formId === 'string' &&
      typeof meta.ciphertext_b64 === 'string';
    if (!canDecrypt) {
      const sizeNote = meta.ciphertext_bytes
        ? `${meta.ciphertext_bytes} ciphertext bytes`
        : meta.ciphertext_placeholder ?? '▒▒▒▒';
      return <SealedPlaceholder plaintext={sizeNote} />;
    }
    return <SealedAnswer meta={meta as SealedFieldMeta} onDecrypt={onDecrypt} />;
  }

  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && 'filename' in value[0]) {
      return (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
          {(value as Array<{ filename: string; size_bytes: number }>).map((f, i) => (
            <li key={i} style={{ padding: '2px 0' }}>
              · {f.filename} ({(f.size_bytes / 1024).toFixed(1)} KB)
            </li>
          ))}
        </ul>
      );
    }
    return <div className="det-answer">{value.join(', ')}</div>;
  }

  if (field.type === 'star_rating' && typeof value === 'number') {
    const scale = field.scale ?? 5;
    return (
      <div className="det-answer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--marker-blue)' }}>
        {Array.from({ length: scale }).map((_, i) => (
          <span key={i} style={{ fontSize: 22, color: i < value ? 'var(--marker-blue)' : 'var(--pencil-soft)' }}>★</span>
        ))}
        <span style={{ fontSize: 18, color: 'var(--ink)', marginLeft: 4 }}>{value}/{scale}</span>
      </div>
    );
  }

  if (field.type === 'url' && typeof value === 'string') {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="det-answer" style={{ color: 'var(--marker-blue)', textDecoration: 'underline wavy', fontSize: 16, wordBreak: 'break-all' }}>
        {value}
      </a>
    );
  }

  return <div className="det-answer">{String(value)}</div>;
}

type DecryptState =
  | { kind: 'sealed' }
  | { kind: 'decrypting' }
  | { kind: 'opened'; plaintext: string }
  | { kind: 'error'; message: string };

function SealedAnswer({
  meta,
  onDecrypt,
}: {
  meta: SealedFieldMeta;
  onDecrypt: (meta: SealedFieldMeta) => Promise<string>;
}) {
  const [state, setState] = useState<DecryptState>({ kind: 'sealed' });

  const handleClick = async () => {
    if (state.kind === 'opened') {
      setState({ kind: 'sealed' });
      return;
    }
    setState({ kind: 'decrypting' });
    try {
      const plaintext = await onDecrypt(meta);
      setState({ kind: 'opened', plaintext });
    } catch (err) {
      setState({ kind: 'error', message: friendlyDecryptError((err as Error).message) });
    }
  };

  const buttonLabel =
    state.kind === 'decrypting'
      ? 'decrypting…'
      : state.kind === 'opened'
        ? '✓ hide'
        : state.kind === 'error'
          ? 'try again →'
          : 'decrypt with wallet →';

  const opened = state.kind === 'opened';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <button
          type="button"
          className={`decrypt-btn${opened ? ' opened' : ''}`}
          onClick={handleClick}
          disabled={state.kind === 'decrypting'}
        >
          {buttonLabel}
        </button>
      </div>
      <div className={`det-answer sealed${opened ? ' opened' : ''}`}>
        {state.kind === 'opened'
          ? state.plaintext
          : state.kind === 'error'
            ? `❌ ${state.message}`
            : state.kind === 'decrypting'
              ? '⌛ key servers releasing shares…'
              : '▒▒▒▒-▒▒▒▒-▒▒-▒▒▒▒▒▒▒'}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--pencil-soft)', marginTop: 4 }}>
        {meta.ciphertext_bytes} bytes ciphertext · {meta.scheme}
      </div>
    </>
  );
}

/** Display-only fallback when sealed value lacks fields needed for real decrypt
 * (e.g. demo seed data, or submissions made before the metadata format change). */
function SealedPlaceholder({ plaintext }: { plaintext: string }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <span className="decrypt-btn" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          legacy · no decrypt
        </span>
      </div>
      <div className="det-answer sealed">{plaintext}</div>
    </>
  );
}

function friendlyDecryptError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('reject')) return 'Wallet signature rejected — click decrypt again to retry.';
  if (lower.includes('no access') || lower.includes('enoaccess'))
    return 'Wallet is not the form owner. Only the form creator can decrypt sealed fields.';
  if (lower.includes('connect')) return 'Connect your wallet first (button top-right).';
  // Phase tags from useSealDecrypt — let the user know WHICH part of the
  // 4-step decrypt blew up so they can retry intelligently.
  if (lower.includes('[seal:session-key]')) return 'Wallet signing failed during session-key setup. Try again or unlock your wallet.';
  if (lower.includes('[seal:fetch-keys]')) return 'Seal key servers unreachable or refused — check connection and retry.';
  if (lower.includes('[seal:decrypt]')) return 'Decryption failed locally after key fetch. Ciphertext may be corrupt.';
  if (lower.includes('[seal:parse-ciphertext]')) return 'Sealed value in this submission is malformed — cannot decode ciphertext.';
  return msg.length > 180 ? msg.slice(0, 180) + '…' : msg;
}
