import { useState } from 'react';
import type { FormSchema } from '../builder/types';
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

/** What's actually written to the Walrus blob — strict subset of fields
 *  that mirror the on-chain submission JSON spec. */
export interface PersistedSubmission {
  version: string;
  form_id: string;
  form_schema_blob_id: string;
  submitted_at_ms: number;
  submitter: string;
  values: Record<string, unknown>;
}

/** Client-only receipt info captured during the live submit flow. Never
 *  written to chain — used purely to render the "saved forever" view with
 *  copyable on-chain artifact links. Either ALL fields exist (real submit)
 *  or the receipt is `null` (preview-only / dry-run). */
export interface SubmitReceipt {
  blobId: string;
  txHash: string;
  walrusCertifyTx?: string;
  /** form_id at the moment of submit — usually equals
   *  `persisted.form_id` but kept separate to survive future migrations. */
  formId: string;
  /** Field ids whose values were Seal-encrypted client-side. Used by
   *  the "🔒 N sealed" badges in the receipt. */
  encryptedFieldIds: string[];
}

/** Compose passed into RunnerReview. `receipt: null` = preview/dry-run
 *  (no real on-chain artifacts yet). `receipt: SubmitReceipt` = live submit
 *  with all artifact links populated. */
export interface SubmittedView {
  persisted: PersistedSubmission;
  receipt: SubmitReceipt | null;
}

interface Props {
  schema: FormSchema;
  submission: SubmittedView;
  embedMode?: boolean;
  onReset: () => void;
  /** Called when the respondent wants to leave embed mode and explore the
   *  full app (Builder etc.) in the same tab. Optional — only meaningful
   *  in embed mode. Without this, share-URL visitors had to close the
   *  tab and re-visit the root URL. */
  onExitEmbed?: () => void;
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  onHome?: () => void;
}

export default function RunnerReview({ schema, submission, embedMode = false, onReset, onExitEmbed, surface, onSurfaceChange, onHome }: Props) {
  const { persisted, receipt } = submission;
  const isReal = receipt !== null;
  const submittedAt = new Date(persisted.submitted_at_ms);
  const submitterShort = `${persisted.submitter.slice(0, 6)}…${persisted.submitter.slice(-4)}`;
  const displayFormId = receipt?.formId ?? persisted.form_id;
  const formIdShort = `${displayFormId.slice(0, 6)}…${displayFormId.slice(-4)}`;

  return (
    <>
      <div className="thinbar">
        {embedMode ? (
          <span className="brand-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <BrandGlyph size="sm" />
            catat
            <small style={{ fontFamily: 'var(--type)', fontSize: 10, marginLeft: 4, color: 'var(--pencil)' }}>· receipt</small>
          </span>
        ) : (
          <button type="button" onClick={onHome} className="brand-mini" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
            <BrandGlyph size="sm" />
            catat
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--type)', fontSize: 10, letterSpacing: '.1em' }}>
            FORM {formIdShort} · receipt
          </span>
          {!embedMode && <SurfaceTabs current={surface} onChange={onSurfaceChange} />}
          <WalletButton />
        </div>
      </div>

      <main className="r-wrap">
        <div className="bigcheck">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>

        <h1 className="r-headline">
          {isReal ? <>Got it. <span className="marker">Saved forever</span>.</> : <>Looks <span className="marker">good</span>.</>}
        </h1>
        <p className="r-lede">
          {isReal ? (
            <>
              Your reply is on Sui, the body sits on Walrus, and any sealed fields are{' '}
              <em>locked client-side</em> — nobody at catat can read them. Below is your receipt.
            </>
          ) : (
            <>
              In production: bundled into a Walrus Quilt, blob_id recorded on the Sui Form object.
              Here is the submission JSON that would go to chain.
            </>
          )}
        </p>

        {receipt && (
          <ReceiptSheet
            blobId={receipt.blobId}
            txHash={receipt.txHash}
            walrusCertifyTx={receipt.walrusCertifyTx}
            formId={displayFormId}
            submitter={persisted.submitter}
            submitterShort={submitterShort}
            submittedAt={submittedAt}
            sealedFieldIds={receipt.encryptedFieldIds}
            schema={schema}
          />
        )}

        <div className="r-actions">
          <a
            className="primary"
            href={receipt ? walruscanBlob(receipt.blobId) : '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            View public proof →
          </a>
          {receipt && (
            <a href={suiscanTx(receipt.txHash)} target="_blank" rel="noopener noreferrer">
              🔍 Sui registry tx
            </a>
          )}
          <button type="button" onClick={onReset}>Submit another</button>
          {embedMode && onExitEmbed && (
            <button
              type="button"
              onClick={onExitEmbed}
              className="primary"
              title="Leave the embedded form view and explore the full catat app — Builder, Inbox, Verify"
            >
              ✨ Make your own form →
            </button>
          )}
        </div>

        <div className="what-next">
          <h4>What happens next?</h4>
          <ol>
            <li>Form owner gets a webhook ping <em>(if configured)</em> within seconds.</li>
            <li>If they decrypt your sealed fields, you&rsquo;ll see it on the verify page timeline.</li>
            <li>Walrus keeps the blob for ~10 epochs. They can extend, you keep your copy.</li>
            <li>Anyone in the world can recompute this receipt — no catat servers required.</li>
          </ol>
        </div>

        <p className="r-signoff">
          Thanks for the report 🙏
          <small>— sketched on real paper, served from Walrus</small>
        </p>
      </main>
    </>
  );
}

interface ReceiptSheetProps {
  blobId: string;
  txHash: string;
  walrusCertifyTx?: string;
  formId: string;
  submitter: string;
  submitterShort: string;
  submittedAt: Date;
  sealedFieldIds: string[];
  schema: FormSchema;
}

function ReceiptSheet({
  blobId,
  txHash,
  walrusCertifyTx,
  formId,
  submitter,
  submitterShort,
  submittedAt,
  sealedFieldIds,
  schema,
}: ReceiptSheetProps) {
  const dateStr = submittedAt.toUTCString().replace(/^[A-Z][a-z]{2},\s/, '');
  const blobShort = `${blobId.slice(0, 12)}…${blobId.slice(-8)}`;
  const txShort = `${txHash.slice(0, 10)}…${txHash.slice(-8)}`;
  const certifyShort = walrusCertifyTx ? `${walrusCertifyTx.slice(0, 10)}…${walrusCertifyTx.slice(-8)}` : null;

  return (
    <div className="rsheet">
      <h3>
        <span>Submission</span>
        <span className="seq">walrus bug report · v1</span>
      </h3>
      <p className="form-line">
        From <b>{submitterShort}</b> · {dateStr}
      </p>

      <ReceiptRow k="walrus blob" v={blobShort} mono link={walruscanBlob(blobId)} copyValue={blobId} />
      <ReceiptRow k="sui registry tx" v={txShort} mono link={suiscanTx(txHash)} copyValue={txHash} />
      {certifyShort && walrusCertifyTx && (
        <ReceiptRow k="walrus certify tx" v={certifyShort} mono link={suiscanTx(walrusCertifyTx)} copyValue={walrusCertifyTx} />
      )}
      <ReceiptRow k="form object" v={`${formId.slice(0, 10)}…${formId.slice(-6)}`} mono link={suiscanObject(formId)} copyValue={formId} />
      <ReceiptRow k="submitter" v={submitterShort} mono copyValue={submitter} />
      <ReceiptRow k="quilt children" v={`${1 + sealedFieldIds.length} — body.json + ${sealedFieldIds.length} sealed`} hand />
      <ReceiptRow k="epochs" v="10 · ~10 days storage" hand />
      <ReceiptRow k="package" v={`${CATAT_PACKAGE_ID.slice(0, 10)}…`} mono link={suiscanObject(CATAT_PACKAGE_ID)} copyValue={CATAT_PACKAGE_ID} />
      <ReceiptRow k="status" v="✓ on-chain · ✓ blob written · ✓ event emitted" green />

      {sealedFieldIds.length > 0 && (
        <div className="sealed-list">
          <b>🔒 {sealedFieldIds.length} field{sealedFieldIds.length === 1 ? '' : 's'} sealed — only the form owner&rsquo;s wallet can decrypt</b>
          Encrypted with Seal · 2-of-3 threshold (pending in this MVP)
          <ul>
            {sealedFieldIds.map(id => {
              const field = schema.fields.find(f => f.id === id);
              return (
                <li key={id}>
                  <span>{field?.label ?? id}</span>
                  <code>▒▒▒▒</code>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="tline">
        <div className="tline-head">timeline</div>
        <TimelineRow what="form encoded for Walrus Quilt" when="+0.0s" />
        {walrusCertifyTx && <TimelineRow what="Walrus reserve + upload + certify" when="+~10s" />}
        <TimelineRow what="catat::form::submit recorded blob_id on Sui" when="+~12s" />
        <TimelineRow what="success receipt rendered" when="+~13s" />
      </div>

      <div className="proof-note">
        <div className="pn-body">
          <b>Save the proof</b>
          Bookmark <code>walruscan.com/testnet/blob/{blobId.slice(0, 12)}…</code> — anyone can fetch the blob and recompute the receipt without trusting catat. We don&rsquo;t hold the data; you do.
        </div>
      </div>
    </div>
  );
}

interface ReceiptRowProps {
  k: string;
  v: string;
  mono?: boolean;
  hand?: boolean;
  green?: boolean;
  link?: string;
  copyValue?: string;
}

function ReceiptRow({ k, v, mono, hand, green, link, copyValue }: ReceiptRowProps) {
  const [copied, setCopied] = useState(false);
  const valClass = green ? 'v green' : hand ? 'v hand' : mono ? 'v' : 'v hand';

  const onCopy = async () => {
    if (!copyValue) return;
    await navigator.clipboard.writeText(copyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rr">
      <span className="k">{k}</span>
      {link ? (
        <a className={valClass} href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
          {v}
        </a>
      ) : (
        <span className={valClass}>{v}</span>
      )}
      {copyValue && (
        <button type="button" className="copy" onClick={onCopy}>
          {copied ? '✓ copied' : 'copy'}
        </button>
      )}
    </div>
  );
}

function TimelineRow({ what, when }: { what: string; when: string }) {
  return (
    <div className="tline-row">
      <span className="what">{what}</span>
      <span className="when">{when}</span>
    </div>
  );
}
