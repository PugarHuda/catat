import { useMemo, useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { toBase64 } from '@mysten/sui/utils';
import { walrus, WalrusFile } from '@mysten/walrus';
import { SealClient } from '@mysten/seal';
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';
import type { FormSchema } from '../builder/types';
import RunnerField, { type Values } from './RunnerField';
import RunnerReview, { type SubmittedView } from './RunnerReview';
import SurfaceTabs from '@/components/SurfaceTabs';
import WalletButton from '@/components/WalletButton';
import BrandGlyph from '@/components/BrandGlyph';
import type { Surface } from '@/lib/surfaces';
import {
  CATAT_PACKAGE_ID,
  SEAL_KEY_SERVERS_TESTNET,
  SUI_CLOCK_OBJECT_ID,
  sealIdentity,
} from '@/lib/contract';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting'; step: string; subStep?: string }
  | { kind: 'error'; message: string };

interface Props {
  schema: FormSchema;
  /** The Form object id this Runner submits into. Lifted from App so Builder
   *  publish can swap it to a wallet-owned form (enabling decrypt round-trip). */
  activeFormId: string;
  /** Respondent mode — hides surface tabs and home link so people who
   *  arrive via a share URL only see the form to fill, not the CMS. */
  embedMode?: boolean;
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  onHome?: () => void;
}

/** Sanitize a filename for use as a Walrus Quilt identifier — no slashes,
 *  spaces collapsed, length-capped. The reader gets the original filename
 *  back from the JSON metadata; this is just the in-Quilt address. */
function sanitizeIdentifier(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
}

interface MediaEntry {
  fieldId: string;
  fileIndex: number;
  file: File;
  /** Stable address inside the Walrus Quilt — matches what we write into
   *  submission.json so admin/preview can pull the bytes back out. */
  identifier: string;
}

function collectMediaEntries(
  schema: { fields: Array<{ id: string; encrypted?: boolean }> },
  values: Record<string, unknown>,
): MediaEntry[] {
  const out: MediaEntry[] = [];
  for (const f of schema.fields) {
    // Sealed fields don't push file bytes — only the metadata gets sealed.
    // Encrypting a video would defeat the Quilt batching benefit and isn't
    // what the brief asks for either.
    if (f.encrypted) continue;
    const v = values[f.id];
    if (v instanceof File) {
      out.push({
        fieldId: f.id,
        fileIndex: 0,
        file: v,
        identifier: `media_${f.id}_0_${sanitizeIdentifier(v.name)}`,
      });
    } else if (Array.isArray(v) && v.length > 0 && v[0] instanceof File) {
      v.forEach((file, i) => {
        if (file instanceof File) {
          out.push({
            fieldId: f.id,
            fileIndex: i,
            file,
            identifier: `media_${f.id}_${i}_${sanitizeIdentifier(file.name)}`,
          });
        }
      });
    }
  }
  return out;
}

function serializeValue(v: unknown, mediaForField: MediaEntry[]): unknown {
  if (mediaForField.length > 0) {
    // For unsealed file fields, swap raw File objects for an array of
    // {filename, size_bytes, content_type, walrus_identifier} so the reader
    // can locate each upload inside the parent Quilt blob.
    return mediaForField.map(m => ({
      filename: m.file.name,
      size_bytes: m.file.size,
      content_type: m.file.type || 'application/octet-stream',
      walrus_identifier: m.identifier,
    }));
  }
  if (Array.isArray(v) && v[0] instanceof File) {
    // Sealed file field — file bytes are dropped, only metadata kept and
    // will then be encrypted alongside the rest of the sealed value.
    return v.map((f: File) => ({
      filename: f.name,
      size_bytes: f.size,
      content_type: f.type || 'application/octet-stream',
      sealed_no_bytes: true,
    }));
  }
  if (v instanceof File) {
    return { filename: v.name, size_bytes: v.size, content_type: v.type, sealed_no_bytes: true };
  }
  return v;
}

function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('user reject') || lower.includes('rejected')) {
    return 'You rejected the wallet signature. Hit submit again to retry.';
  }
  if (lower.includes('wal') && (lower.includes('insufficient') || lower.includes('not enough') || lower.includes('balance'))) {
    return 'No spendable WAL. Open wallet popup (top-right) → "Get WAL (swap 0.5 SUI)". Stakely-faucet WAL is wrong package and won\'t work.';
  }
  if (lower.includes('sui') && (lower.includes('insufficient') || lower.includes('not enough') || lower.includes('balance'))) {
    return 'Wallet has no SUI for gas. Get testnet SUI from faucet.sui.io, then click "Get WAL" in your wallet popup.';
  }
  if (lower.includes('coin') && lower.includes('balance')) {
    return 'Wallet missing required coin balance. Need SUI (faucet.sui.io) + WAL (wallet popup → Get WAL).';
  }
  return msg.length > 220 ? msg.slice(0, 220) + '…' : msg;
}

export default function RunnerSurface({ schema, activeFormId, embedMode = false, surface, onSurfaceChange, onHome }: Props) {
  const [values, setValues] = useState<Values>({});
  const [submitted, setSubmitted] = useState<SubmittedView | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });

  const account = useCurrentAccount();
  const sui = useSuiClient();
  const queryClient = useQueryClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

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

  const sealClient = useMemo(() => {
    return new SealClient({
      suiClient: sui as unknown as ConstructorParameters<typeof SealClient>[0]['suiClient'],
      serverConfigs: SEAL_KEY_SERVERS_TESTNET.map(objectId => ({ objectId, weight: 1 })),
    });
  }, [sui]);

  const updateValue = (id: string, v: unknown) => {
    setValues(prev => ({ ...prev, [id]: v }));
  };

  const totalFields = schema.fields.length;
  const requiredCount = schema.fields.filter(f => f.required).length;
  const sealedCount = schema.fields.filter(f => f.encrypted).length;
  const answeredCount = schema.fields.filter(f => {
    const v = values[f.id];
    if (v == null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'number') return true;
    return true;
  }).length;
  const progressPct = totalFields > 0 ? Math.round((answeredCount / totalFields) * 100) : 0;

  const isComplete = schema.fields.every(f => {
    if (!f.required) return true;
    const v = values[f.id];
    if (v == null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'number') return true;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      setSubmitState({
        kind: 'error',
        message: 'Connect wallet to submit. Wallet button is at the top-right.',
      });
      return;
    }

    const submissionValues: Record<string, unknown> = {};
    const encryptedFieldIds: string[] = [];

    // Phase 0: collect File objects from un-sealed file fields. These will
    // ride along inside the same Walrus Quilt as submission.json so the
    // submission travels as one self-contained blob.
    const mediaEntries = collectMediaEntries(schema, values);
    if (mediaEntries.length > 0) {
      setSubmitState({
        kind: 'submitting',
        step: `Reading ${mediaEntries.length} attached file${mediaEntries.length === 1 ? '' : 's'}…`,
      });
    }

    // Build values, encrypting any sealed fields client-side via Seal IBE.
    const sealedFields = schema.fields.filter(f => f.encrypted && values[f.id] != null);
    if (sealedFields.length > 0) {
      setSubmitState({ kind: 'submitting', step: `Encrypting ${sealedFields.length} sealed field${sealedFields.length === 1 ? '' : 's'} via Seal…` });
    }

    for (const f of schema.fields) {
      const raw = values[f.id];
      const mediaForField = mediaEntries.filter(m => m.fieldId === f.id);
      const serialized = serializeValue(raw, mediaForField);

      if (f.encrypted && raw != null) {
        encryptedFieldIds.push(f.id);
        const plaintext =
          typeof serialized === 'string'
            ? serialized
            : JSON.stringify(serialized ?? null);

        try {
          const { encryptedObject } = await sealClient.encrypt({
            threshold: 2,
            packageId: CATAT_PACKAGE_ID,
            id: sealIdentity(activeFormId, f.id),
            data: new TextEncoder().encode(plaintext),
          });
          submissionValues[f.id] = {
            encrypted: true,
            scheme: 'seal-ibe-2of3',
            packageId: CATAT_PACKAGE_ID,
            formId: activeFormId,
            fieldId: f.id,
            keyId: sealIdentity(activeFormId, f.id),
            ciphertext_b64: toBase64(encryptedObject),
            ciphertext_bytes: encryptedObject.length,
            plaintext_bytes: plaintext.length,
          };
        } catch (err) {
          console.error(`Seal encrypt failed for ${f.id}:`, err);
          throw new Error(`Seal encryption failed for "${f.label}": ${(err as Error).message}`);
        }
      } else {
        submissionValues[f.id] = serialized ?? null;
      }
    }

    const submissionPayload = {
      version: '1.0',
      form_id: activeFormId,
      submitted_at_ms: Date.now(),
      submitter: account.address,
      values: submissionValues,
    };

    const submissionFile = WalrusFile.from({
      contents: new TextEncoder().encode(JSON.stringify(submissionPayload)),
      identifier: 'submission.json',
      tags: { 'content-type': 'application/json' },
    });

    // Read media file bytes once and bundle them into the same Quilt as
    // submission.json. The Quilt has one shared blob_id; each file is
    // addressable via its `identifier`.
    let mediaWalrusFiles: Array<ReturnType<typeof WalrusFile.from>> = [];
    try {
      mediaWalrusFiles = await Promise.all(
        mediaEntries.map(async m => WalrusFile.from({
          contents: new Uint8Array(await m.file.arrayBuffer()),
          identifier: m.identifier,
          tags: { 'content-type': m.file.type || 'application/octet-stream' },
        })),
      );
    } catch (err) {
      setSubmitState({
        kind: 'error',
        message: `Failed to read attached file: ${(err as Error).message}`,
      });
      return;
    }

    try {
      setSubmitState({
        kind: 'submitting',
        step: mediaEntries.length > 0
          ? `Encoding submission + ${mediaEntries.length} file${mediaEntries.length === 1 ? '' : 's'} for Walrus…`
          : 'Encoding for Walrus…',
      });
      const flow = walrusClient.walrus.writeFilesFlow({
        files: [submissionFile, ...mediaWalrusFiles],
      });
      // encode() returns the deterministic blob_id (Merkle root of slivers)
      // before any network call. We need it here so we can bake it into the
      // combined certify+submit PTB below.
      const encoded = await flow.encode();
      const blobId = encoded.blobId;
      if (!blobId) {
        throw new Error('Walrus encode returned no blobId — refusing to start submit flow');
      }

      setSubmitState({ kind: 'submitting', step: 'Sign Walrus reserve', subStep: '1 of 3' });
      const registerTx = flow.register({
        epochs: 10,
        owner: account.address,
        deletable: false,
      });
      const registerResult = await signAndExecute({ transaction: registerTx });

      setSubmitState({ kind: 'submitting', step: 'Uploading via Walrus relay…' });
      await flow.upload({ digest: registerResult.digest });

      // Sequential 3-sig flow (rolled back from combined-PTB approach —
      // see same comment in BuilderSurface). Three smaller txs index
      // independently and each digest is debuggable on its own.
      setSubmitState({ kind: 'submitting', step: 'Sign Walrus certify', subStep: '2 of 3' });
      const certifyTx = flow.certify();
      const certifyResult = await signAndExecute({ transaction: certifyTx });
      console.log('[submit] Walrus certify confirmed, digest:', certifyResult.digest);

      setSubmitState({ kind: 'submitting', step: 'Sign Sui form::submit', subStep: '3 of 3' });
      const recordTx = new Transaction();
      recordTx.moveCall({
        target: `${CATAT_PACKAGE_ID}::form::submit`,
        arguments: [
          recordTx.object(activeFormId),
          recordTx.pure.string(blobId),
          recordTx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });
      const recordResult = await signAndExecute({ transaction: recordTx });
      console.log('[submit] Sui form::submit submitted, digest:', recordResult.digest);

      setSubmitted({
        persisted: {
          version: '1.0',
          form_id: submissionPayload.form_id,
          form_schema_blob_id: 'blob_schema_pending_publish',
          submitted_at_ms: submissionPayload.submitted_at_ms,
          submitter: account.address,
          values: submissionValues,
        },
        receipt: {
          blobId,
          txHash: recordResult.digest,
          walrusCertifyTx: certifyResult.digest,
          formId: activeFormId,
          encryptedFieldIds,
        },
      });
      queryClient.invalidateQueries({ queryKey: ['form-stats'] });
      queryClient.invalidateQueries({ queryKey: ['form-real-submissions'] });
      setSubmitState({ kind: 'idle' });
    } catch (err) {
      console.error('Walrus submit failed:', err);
      const msg = (err as Error).message || 'Unknown error';
      setSubmitState({ kind: 'error', message: friendlyError(msg) });
    }
  };

  if (submitted) {
    return (
      <RunnerReview
        schema={schema}
        submission={submitted}
        embedMode={embedMode}
        onReset={() => {
          setValues({});
          setSubmitted(null);
        }}
        surface={surface}
        onSurfaceChange={onSurfaceChange}
        onHome={onHome}
      />
    );
  }

  return (
    <>
      <div className="thinbar">
        {embedMode ? (
          // In embed mode the brand becomes a "powered by" link that opens
          // the catat home page in a NEW TAB so respondents don't lose
          // their in-progress form by accident.
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="brand-mini"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}
            title="Built with catat — open the home page"
          >
            <BrandGlyph size="sm" />
            catat
            <small style={{ fontFamily: 'var(--type)', fontSize: 10, marginLeft: 4, color: 'var(--pencil)' }}>· form by walrus ↗</small>
          </a>
        ) : (
          <button type="button" onClick={onHome} className="brand-mini" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
            <BrandGlyph size="sm" />
            catat
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--type)', fontSize: 10, letterSpacing: '.1em' }}>
            FORM {activeFormId.slice(0, 6)}…{activeFormId.slice(-4)}
          </span>
          {!embedMode && <SurfaceTabs current={surface} onChange={onSurfaceChange} />}
          <WalletButton />
        </div>
      </div>

      <main className="form-wrap">
        {!embedMode && (
          <div className="preview-banner">
            <b>👁 Preview mode</b>
            <span>You&rsquo;re testing the form yourself — submit still spends real WAL + SUI. Send respondents the <b>share URL</b> from your Publish modal for a clean fill-only view.</span>
          </div>
        )}
        <form className="fsheet" onSubmit={handleSubmit}>
          <div className="fhead">
            <div className="meta">
              Form receipt · <b>{schema.title}</b>
              {schema.description && <>{' '}· {schema.description.slice(0, 60)}</>}
            </div>
            <span className="stamp">live · open ✎</span>
          </div>

          <h1 className="ftitle">
            <FormHeadline title={schema.title} />
          </h1>
          {schema.description && <p className="fdesc">{schema.description}</p>}
          <div className="byline">
            <span>{totalFields} questions · {requiredCount} required · {sealedCount} sealed</span>
            <span>by {account ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}` : 'connect wallet to submit'}</span>
          </div>

          {account ? (
            <span className="gate-line">
              <CheckIcon />
              Connected — you can submit
            </span>
          ) : (
            <span className="gate-line warn">
              <LockIcon />
              Connect a Sui wallet (top-right) to sign &amp; submit
            </span>
          )}

          <div className="progress">
            <span>question {answeredCount} of {totalFields}</span>
            <div className="bar">
              <div className="f" style={{ width: `${progressPct}%` }} />
            </div>
            <span>{progressPct}%</span>
          </div>

          {schema.fields.map((field, i) => (
            <RunnerField
              key={field.id}
              field={field}
              index={i + 1}
              value={values[field.id]}
              onChange={v => updateValue(field.id, v)}
            />
          ))}

          <div className="fsubmit">
            {submitState.kind === 'error' && (
              <div className="submit-error" style={{ width: '100%' }}>
                <AlertIcon />
                <div className="body">
                  <b>Submission failed</b>
                  <code>{submitState.message}</code>
                </div>
              </div>
            )}
            {submitState.kind === 'submitting' && (
              <div className="submit-progress" style={{ width: '100%' }}>
                <span className="spin" />
                <span>{submitState.step}</span>
                {submitState.subStep && <small>· {submitState.subStep}</small>}
              </div>
            )}

            <p className="meta-line">
              <LockIconInline />
              {sealedCount > 0 ? (
                <>
                  {sealedCount} field{sealedCount === 1 ? '' : 's'} will be encrypted client-side with Seal before they leave this device.
                  The Walrus blob and Sui event are public — sealed bodies stay sealed even from us.
                  {' '}Attached files (un-sealed) ride along inside the same Quilt blob.
                </>
              ) : (
                <>3 wallet sigs: Walrus reserve → certify → Sui form::submit. Submission JSON + any attached files all bundle into one Walrus Quilt blob; that blob_id is appended to the on-chain Form.</>
              )}
            </p>
            <span className="gas-tip">~ <b>0.0021 SUI</b> · gas</span>
            <button
              className="btn-submit"
              type="submit"
              disabled={!isComplete || submitState.kind === 'submitting' || !account}
            >
              <CheckIcon />
              {!account ? 'Connect wallet first' : submitState.kind === 'submitting' ? 'Submitting…' : 'Sign & submit'}
            </button>
          </div>
        </form>

        <p className="powered">
          Hosted on Vercel · forms by <b>catat</b> ·{' '}
          <a href="https://github.com/PugarHuda/catat" target="_blank" rel="noopener noreferrer">make your own ↗</a>
        </p>
      </main>
    </>
  );
}

/** Headline derived from the form title — last word marker-styled like
 *  the design pattern (e.g. "NPS Survey" → "NPS [Survey]"). Single-word
 *  titles get the whole word marker-styled. Falls back gracefully for
 *  empty titles. */
function FormHeadline({ title }: { title: string }) {
  const trimmed = title.trim();
  if (!trimmed) return <>Untitled <span className="marker">form</span>.</>;
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return <span className="marker">{parts[0]}</span>;
  const last = parts[parts.length - 1]!;
  const rest = parts.slice(0, -1).join(' ');
  return <>{rest} <span className="marker">{last}</span></>;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function LockIconInline() {
  return (
    <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}
