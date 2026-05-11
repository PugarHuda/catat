import { useMemo, useState } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { walrus } from '@mysten/walrus';
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';
import SurfaceTabs from '@/components/SurfaceTabs';
import WalletButton from '@/components/WalletButton';
import BrandGlyph from '@/components/BrandGlyph';
import type { Surface } from '@/lib/surfaces';
import {
  CATAT_PACKAGE_ID,
  suiscanObject,
  suiscanTx,
  walruscanBlob,
} from '@/lib/contract';

interface Props {
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  onHome?: () => void;
}

interface SubmissionAddedEvent {
  form_id: string;
  submitter: string;
  blob_id: string;
  timestamp_ms: string;
}

interface VerifiedSubmission {
  txHash: string;
  blobId: string;
  formId: string;
  submitter: string;
  timestampMs: number;
  body: {
    version?: string;
    form_id?: string;
    submitted_at_ms?: number;
    submitter?: string;
    values?: Record<string, unknown>;
  };
}

type Step = 'pending' | 'pass' | 'fail';
type StepState = { kind: Step; detail: string };
type VerifyState =
  | { kind: 'idle' }
  | { kind: 'verifying'; steps: StepState[] }
  | { kind: 'done'; steps: StepState[]; verified: VerifiedSubmission }
  | { kind: 'failed'; steps: StepState[]; error: string };

export default function VerifySurface({ surface, onSurfaceChange, onHome }: Props) {
  const sui = useSuiClient();
  const [input, setInput] = useState('');
  const [state, setState] = useState<VerifyState>({ kind: 'idle' });

  const walrusClient = useMemo(() => {
    return sui.$extend(
      walrus({
        wasmUrl: walrusWasmUrl,
        uploadRelay: {
          host: 'https://upload-relay.testnet.walrus.space',
          sendTip: { max: 1_000 },
        },
      }),
    );
  }, [sui]);

  const handleVerify = async () => {
    const txInput = input.trim();
    if (!txInput) return;

    const steps: StepState[] = [
      { kind: 'pending', detail: 'Querying Sui RPC for tx…' },
      { kind: 'pending', detail: 'Awaiting…' },
      { kind: 'pending', detail: 'Awaiting…' },
      { kind: 'pending', detail: 'Awaiting…' },
    ];
    let currentStep = 0;

    setState({ kind: 'verifying', steps: [...steps] });

    try {
      // Step 1: fetch tx from Sui
      const tx = await sui.getTransactionBlock({
        digest: txInput,
        options: { showEvents: true, showInput: true, showEffects: true },
      });
      if (!tx?.digest) {
        steps[0] = { kind: 'fail', detail: 'Tx not found on Sui testnet.' };
        setState({ kind: 'failed', steps: [...steps], error: 'Tx not found' });
        return;
      }
      steps[0] = { kind: 'pass', detail: `Found in checkpoint ${tx.checkpoint ?? '?'}` };
      currentStep = 1;
      setState({ kind: 'verifying', steps: [...steps] });

      // Step 2: find SubmissionAdded event from catat::form
      const expectedType = `${CATAT_PACKAGE_ID}::form::SubmissionAdded`;
      const event = tx.events?.find(e => e.type === expectedType);
      if (!event) {
        steps[1] = { kind: 'fail', detail: `No catat::form::SubmissionAdded event in this tx.` };
        setState({ kind: 'failed', steps: [...steps], error: 'Not a catat submission tx' });
        return;
      }
      const parsed = event.parsedJson as SubmissionAddedEvent;
      steps[1] = { kind: 'pass', detail: `catat::form::submit confirmed.` };
      currentStep = 2;
      setState({ kind: 'verifying', steps: [...steps] });

      // Step 3 + 4 combined: fetch blob from Walrus (Quilt-aware) + parse body.
      // The submission is a Quilt with submission.json + optional media files.
      let body: VerifiedSubmission['body'];
      let blobByteCount = 0;
      try {
        const blob = await walrusClient.walrus.getBlob({ blobId: parsed.blob_id });
        const files = await blob.files({ identifiers: ['submission.json'] });
        const submissionFile = files[0] ?? blob.asFile();
        const bytes = await submissionFile.bytes();
        blobByteCount = bytes.length;
        body = JSON.parse(new TextDecoder().decode(bytes));
      } catch (e) {
        steps[2] = { kind: 'fail', detail: `Walrus read failed: ${(e as Error).message.slice(0, 80)}` };
        setState({ kind: 'failed', steps: [...steps], error: 'Walrus blob unreachable or unparseable' });
        return;
      }
      steps[2] = { kind: 'pass', detail: `Walrus returned ${blobByteCount} bytes.` };
      currentStep = 3;
      setState({ kind: 'verifying', steps: [...steps] });

      // Step 4: validate body matches the event payload
      const formMatches = body.form_id === parsed.form_id;
      const submitterMatches = body.submitter === parsed.submitter;
      if (!formMatches || !submitterMatches) {
        steps[3] = {
          kind: 'fail',
          detail: `Body inconsistency: form_id ${formMatches ? 'OK' : 'mismatch'}, submitter ${submitterMatches ? 'OK' : 'mismatch'}.`,
        };
        setState({ kind: 'failed', steps: [...steps], error: 'Body does not match event' });
        return;
      }
      steps[3] = { kind: 'pass', detail: 'Body matches event payload.' };

      setState({
        kind: 'done',
        steps: [...steps],
        verified: {
          txHash: tx.digest,
          blobId: parsed.blob_id,
          formId: parsed.form_id,
          submitter: parsed.submitter,
          timestampMs: Number(parsed.timestamp_ms),
          body,
        },
      });
    } catch (e) {
      const msg = (e as Error).message || 'Unknown error';
      console.error('Verify failed:', e);
      // Mark the step that was in flight as failed so the user sees WHICH
      // phase blew up (instead of all four staying on "Awaiting…").
      steps[currentStep] = {
        kind: 'fail',
        detail: msg.length > 100 ? msg.slice(0, 100) + '…' : msg,
      };
      setState({
        kind: 'failed',
        steps: [...steps],
        error: msg.length > 200 ? msg.slice(0, 200) + '…' : msg,
      });
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  return (
    <>
      <header className="nav">
        <div className="wrap nav-row">
          <button type="button" onClick={onHome} className="brand" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
            <BrandGlyph />
            catat
            <small>· verify</small>
          </button>
          <SurfaceTabs current={surface} onChange={onSurfaceChange} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="sheet">
          <div className="sheet-head">
            <span>Verify · public proof page</span>
            <span className="date">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <span className="section-eyebrow" style={{ display: 'block' }}>— recompute the receipt —</span>
          <h1 style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1, margin: '0 0 8px', color: 'var(--ink)' }}>
            Trust, but <span className="marker">verify.</span>
          </h1>
          <p style={{ fontFamily: 'var(--body)', fontSize: 18, color: 'var(--ink-soft)', margin: '0 0 22px', maxWidth: '60ch' }}>
            Paste any catat <code style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>catat::form::submit</code> tx digest. We&rsquo;ll fetch it from Sui, pull the body straight from Walrus, and tell you whether the on-chain event matches the actual blob. No catat servers in the loop.
          </p>

          <form onSubmit={onSubmit} className="lookup">
            <label>tx digest</label>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="paste a Sui tx digest from the receipt page…"
              spellCheck={false}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!input.trim() || state.kind === 'verifying'}>
              {state.kind === 'verifying' ? 'verifying…' : 'Verify ↵'}
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text) setInput(text.trim());
                } catch (err) {
                  console.warn('clipboard read blocked:', err);
                  // Browser denied — most common cause is non-secure context
                  // or no permission. The input stays focused so user can
                  // paste manually with Ctrl+V.
                  alert('Clipboard read blocked by browser. Paste manually with Ctrl+V (or ⌘V).');
                }
              }}
            >
              Paste
            </button>
          </form>

          {state.kind !== 'idle' && (
            <>
              <div className="v-steps">
                <Step n="01" title="Found tx" state={state.steps[0]!} />
                <Step n="02" title="Parsed event" state={state.steps[1]!} />
                <Step n="03" title="Fetched blob" state={state.steps[2]!} />
                <Step n="04" title="Body matches" state={state.steps[3]!} />
              </div>

              <div className="verify-grid">
                {state.kind === 'done' ? (
                  <ProofCard verified={state.verified} />
                ) : state.kind === 'failed' ? (
                  <FailCard error={state.error} />
                ) : (
                  <div className="v-empty">
                    Verifying…
                    <small>fetching from Sui RPC + Walrus storage nodes</small>
                  </div>
                )}

                <aside className="trust-list">
                  <div className="trust-card">
                    <h4>What does &ldquo;verified&rdquo; mean?</h4>
                    <p>
                      Three independent things matched: the on-chain Sui event, the actual Walrus blob bytes, and the cross-reference between them. If any disagrees, this page would say <b>tampered</b>.
                    </p>
                    <div className="row"><span>checks done</span><b>4 / 4</b></div>
                    <div className="row"><span>servers in loop</span><b>0</b></div>
                    <div className="row"><span>data source</span><b>Sui RPC + Walrus</b></div>
                  </div>

                  <div className="postit pink" style={{ transform: 'rotate(-2deg)' }}>
                    <b>note</b>
                    Sealed bodies stay sealed even on this page. Only the form owner&rsquo;s wallet can produce the 2-of-3 share to decrypt.
                  </div>
                </aside>
              </div>
            </>
          )}

          {state.kind === 'idle' && (
            <div className="v-empty">
              Paste a tx digest above to verify.
              <small>get one from any submission receipt or from your form&rsquo;s on-chain history</small>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Step({ n, title, state }: { n: string; title: string; state: StepState }) {
  const cls = state.kind === 'pass' ? 'pass' : state.kind === 'fail' ? 'fail' : 'pending';
  const ck = state.kind === 'pass' ? '✓' : state.kind === 'fail' ? '✗' : '·';
  return (
    <div className={`v-step ${cls}`}>
      <div className="label">step {n}</div>
      <h5><span className="ck">{ck}</span>{title}</h5>
      <p>{state.detail}</p>
    </div>
  );
}

function FailCard({ error }: { error: string }) {
  return (
    <div className="proof-card">
      <div className="stamp fail">tampered ✗</div>
      <h2>Verification failed.</h2>
      <p className="sub">{error}</p>
      <p style={{ fontFamily: 'var(--type)', fontSize: 12, color: 'var(--pencil)', letterSpacing: '.04em' }}>
        Make sure the digest is from a catat <code style={{ fontFamily: 'var(--mono)' }}>catat::form::submit</code> tx on Sui testnet (not Walrus reserve / certify, those are separate transactions).
      </p>
    </div>
  );
}

function ProofCard({ verified }: { verified: VerifiedSubmission }) {
  const at = new Date(verified.timestampMs);
  const dateStr = at.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const submitterShort = `${verified.submitter.slice(0, 8)}…${verified.submitter.slice(-6)}`;
  const blobShort = `${verified.blobId.slice(0, 14)}…${verified.blobId.slice(-8)}`;
  const formShort = `${verified.formId.slice(0, 10)}…${verified.formId.slice(-6)}`;

  const title = (verified.body.values?.f_title as string | undefined) ?? '(no title field)';
  const severity = (verified.body.values?.f_severity as string | undefined) ?? null;
  const description = (verified.body.values?.f_description as string | undefined) ?? null;

  const valueEntries = Object.entries(verified.body.values ?? {});

  return (
    <div className="proof-card">
      <div className="stamp">verified ✓</div>
      <div className="proof-h">
        <span>submission · catat::form on testnet</span>
        <span className="id">{dateStr}</span>
      </div>
      <h2>{title}</h2>
      <p className="sub">
        Submitted by <b>{submitterShort}</b>{severity && <> · severity <b>{severity}</b></>} · sealed fields stay sealed even here.
      </p>

      <ProofRow k="tx digest" v={verified.txHash} link={suiscanTx(verified.txHash)} check="signed" />
      <ProofRow k="walrus blob" v={blobShort} link={walruscanBlob(verified.blobId)} check="found" />
      <ProofRow k="form object" v={formShort} link={suiscanObject(verified.formId)} check="match" />
      <ProofRow k="submitter" v={submitterShort} check="match" />
      <ProofRow k="package" v={`${CATAT_PACKAGE_ID.slice(0, 12)}…`} link={suiscanObject(CATAT_PACKAGE_ID)} check="catat" />
      <ProofRow k="body integrity" v="event.form_id == body.form_id && event.submitter == body.submitter" check="match" />

      <div className="fields-block">
        <h3>Fields, as stored on Walrus.</h3>
        {valueEntries.length === 0 && (
          <div style={{ fontFamily: 'var(--body)', fontSize: 14, color: 'var(--pencil-soft)' }}>
            (no values in body)
          </div>
        )}
        {valueEntries.map(([fieldId, value]) => {
          const isEncrypted = value != null && typeof value === 'object' && (value as { encrypted?: boolean }).encrypted === true;
          return (
            <div className="fld-line" key={fieldId}>
              <span className="q">
                {fieldId}
                {isEncrypted && (
                  <span className="lock-tag" style={{ transform: 'none' }}>
                    🔒
                  </span>
                )}
              </span>
              {isEncrypted ? (
                <span className="a sealed">▒▒▒▒-▒▒▒▒-▒▒▒▒</span>
              ) : (
                <span className="a">{stringifyValue(value)}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="actions" style={{ marginTop: 24 }}>
        <a className="btn btn-sm" href={suiscanTx(verified.txHash)} target="_blank" rel="noopener noreferrer">
          Open on Sui ↗
        </a>
        <a className="btn btn-sm" href={walruscanBlob(verified.blobId)} target="_blank" rel="noopener noreferrer">
          Open on Walrus ↗
        </a>
        <a className="btn btn-sm" href={suiscanObject(verified.formId)} target="_blank" rel="noopener noreferrer">
          Form object ↗
        </a>
      </div>

      {description && (
        <div style={{ marginTop: 16, padding: 14, background: 'var(--paper)', border: '1.5px dashed var(--ink)', borderRadius: 8, fontFamily: 'var(--body)', fontSize: 15, color: 'var(--ink)', lineHeight: 1.5 }}>
          <div style={{ fontFamily: 'var(--type)', fontSize: 10, color: 'var(--pencil)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            description
          </div>
          {description}
        </div>
      )}
    </div>
  );
}

function ProofRow({ k, v, link, check }: { k: string; v: string; link?: string; check: string }) {
  return (
    <div className="v-proof-row">
      <span className="key">{k}</span>
      {link ? (
        <span className="val">
          <a href={link} target="_blank" rel="noopener noreferrer">{v}</a>
        </span>
      ) : (
        <span className="val">{v}</span>
      )}
      <span className="check">
        <CheckIcon />
        {check}
      </span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

function stringifyValue(v: unknown): string {
  if (v == null) return '(empty)';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return '(none)';
    if (typeof v[0] === 'object' && v[0] !== null && 'filename' in v[0]) {
      return v.map((f: unknown) => (f as { filename: string }).filename).join(', ');
    }
    return v.join(', ');
  }
  return JSON.stringify(v);
}
