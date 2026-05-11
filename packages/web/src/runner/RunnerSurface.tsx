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
import RunnerReview, { type SerializedSubmission } from './RunnerReview';
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
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  onHome?: () => void;
}

function serializeValue(v: unknown): unknown {
  if (Array.isArray(v) && v[0] instanceof File) {
    return v.map((f: File) => ({
      filename: f.name,
      size_bytes: f.size,
      content_type: f.type || 'application/octet-stream',
    }));
  }
  if (v instanceof File) {
    return { filename: v.name, size_bytes: v.size, content_type: v.type };
  }
  return v;
}

function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('user reject') || lower.includes('rejected')) {
    return 'You rejected the wallet signature. Hit submit again to retry.';
  }
  if (lower.includes('wal') && (lower.includes('insufficient') || lower.includes('not enough') || lower.includes('balance'))) {
    return 'Wallet has no WAL token. Get testnet WAL from stakely.io/faucet/walrus-testnet-wal then retry.';
  }
  if (lower.includes('sui') && (lower.includes('insufficient') || lower.includes('not enough') || lower.includes('balance'))) {
    return 'Wallet has no SUI for gas. Get testnet SUI from faucet.sui.io then retry.';
  }
  if (lower.includes('coin') && lower.includes('balance')) {
    return 'Wallet missing required coin balance (SUI for gas + WAL for storage). Fund via faucets and retry.';
  }
  return msg.length > 220 ? msg.slice(0, 220) + '…' : msg;
}

export default function RunnerSurface({ schema, activeFormId, surface, onSurfaceChange, onHome }: Props) {
  const [values, setValues] = useState<Values>({});
  const [submitted, setSubmitted] = useState<SerializedSubmission | null>(null);
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

    // Build values, encrypting any sealed fields client-side via Seal IBE.
    const sealedFields = schema.fields.filter(f => f.encrypted && values[f.id] != null);
    if (sealedFields.length > 0) {
      setSubmitState({ kind: 'submitting', step: `Encrypting ${sealedFields.length} sealed field${sealedFields.length === 1 ? '' : 's'} via Seal…` });
    }

    for (const f of schema.fields) {
      const raw = values[f.id];
      const serialized = serializeValue(raw);

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

    try {
      setSubmitState({ kind: 'submitting', step: 'Encoding for Walrus…' });
      const flow = walrusClient.walrus.writeFilesFlow({ files: [submissionFile] });
      await flow.encode();

      setSubmitState({ kind: 'submitting', step: 'Sign Walrus reserve', subStep: '1 of 3' });
      const registerTx = flow.register({
        epochs: 10,
        owner: account.address,
        deletable: false,
      });
      const registerResult = await signAndExecute({ transaction: registerTx });

      setSubmitState({ kind: 'submitting', step: 'Uploading via Walrus relay…' });
      await flow.upload({ digest: registerResult.digest });

      setSubmitState({ kind: 'submitting', step: 'Sign Walrus certify', subStep: '2 of 3' });
      const certifyTx = flow.certify();
      const certifyResult = await signAndExecute({ transaction: certifyTx });

      const filesUploaded = await flow.listFiles();
      const blobId = filesUploaded[0]?.blobId;
      if (!blobId) {
        throw new Error('Walrus certify returned no blobId — refusing to record placeholder on-chain');
      }

      setSubmitState({ kind: 'submitting', step: 'Sign Sui registry record', subStep: '3 of 3' });
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

      setSubmitted({
        version: '1.0',
        form_id: submissionPayload.form_id,
        form_schema_blob_id: 'blob_schema_pending_publish',
        submitted_at_ms: submissionPayload.submitted_at_ms,
        submitter: account.address,
        values: submissionValues,
        _meta_encrypted_field_ids: encryptedFieldIds,
        _real_blob_id: blobId,
        _real_tx_hash: recordResult.digest,
        _real_walrus_certify_tx: certifyResult.digest,
        _real_form_id: activeFormId,
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
        <button type="button" onClick={onHome} className="brand-mini" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
          <BrandGlyph size="sm" />
          catat
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--type)', fontSize: 10, letterSpacing: '.1em' }}>
            FORM {activeFormId.slice(0, 6)}…{activeFormId.slice(-4)}
          </span>
          <SurfaceTabs current={surface} onChange={onSurfaceChange} />
          <WalletButton />
        </div>
      </div>

      <main className="form-wrap">
        <form className="fsheet" onSubmit={handleSubmit}>
          <div className="fhead">
            <div className="meta">
              Form receipt · <b>{schema.title}</b>
              {schema.description && <>{' '}· {schema.description.slice(0, 60)}</>}
            </div>
            <span className="stamp">live · open ✎</span>
          </div>

          <h1 className="ftitle">
            Tell us what <span className="marker">broke</span>.
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
                </>
              ) : (
                <>3 wallet sigs: Walrus reserve → certify → Sui registry. Submission JSON ends up as a Walrus blob, blob_id appended to the on-chain Form.</>
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
