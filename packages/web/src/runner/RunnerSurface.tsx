import { useMemo, useState } from 'react';
import { Send, Loader2, AlertTriangle, Wallet } from 'lucide-react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { walrus, WalrusFile } from '@mysten/walrus';
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';
import type { FormSchema } from '../builder/types';
import RunnerField, { type Values } from './RunnerField';
import RunnerReview, { type SerializedSubmission } from './RunnerReview';
import SurfaceTabs from '@/components/SurfaceTabs';
import WalletButton from '@/components/WalletButton';
import type { Surface } from '@/lib/surfaces';
import { cn } from '@/lib/utils';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting'; step: string; subStep?: string }
  | { kind: 'error'; message: string };

interface Props {
  schema: FormSchema;
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
    return 'You rejected the wallet signature. Click Submit again to retry.';
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
  return msg.length > 200 ? msg.slice(0, 200) + '…' : msg;
}

export default function RunnerSurface({ schema, surface, onSurfaceChange, onHome }: Props) {
  const [values, setValues] = useState<Values>({});
  const [submitted, setSubmitted] = useState<SerializedSubmission | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });

  const account = useCurrentAccount();
  const sui = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const walrusClient = useMemo(() => {
    return sui.$extend(walrus({ wasmUrl: walrusWasmUrl }));
  }, [sui]);

  const updateValue = (id: string, v: unknown) => {
    setValues(prev => ({ ...prev, [id]: v }));
  };

  const isComplete = schema.fields.every(f => {
    if (!f.required) return true;
    const v = values[f.id];
    if (v == null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'number') return true;
    return true;
  });

  const handleSubmit = async () => {
    if (!account) {
      setSubmitState({
        kind: 'error',
        message: 'Connect wallet to submit. Wallet button is at the top-right.',
      });
      return;
    }

    const submissionValues: Record<string, unknown> = {};
    const encryptedFieldIds: string[] = [];

    for (const f of schema.fields) {
      const raw = values[f.id];
      const serialized = serializeValue(raw);

      if (f.encrypted && raw != null) {
        encryptedFieldIds.push(f.id);
        const previewSize =
          typeof serialized === 'string'
            ? serialized.length
            : JSON.stringify(serialized ?? null).length;
        submissionValues[f.id] = {
          encrypted: true,
          scheme: 'seal-ibe-2of3-pending',
          ciphertext_placeholder: `[Seal-encryption pending: ~${previewSize} bytes plaintext]`,
        };
      } else {
        submissionValues[f.id] = serialized ?? null;
      }
    }

    const submissionPayload = {
      version: '1.0',
      form_id: '0xtest_form_object_id',
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

      setSubmitState({ kind: 'submitting', step: 'Sign storage reservation', subStep: '1 of 2' });
      const registerTx = flow.register({
        epochs: 10,
        owner: account.address,
        deletable: false,
      });
      const registerResult = await signAndExecute({ transaction: registerTx });

      setSubmitState({ kind: 'submitting', step: 'Uploading to storage nodes…' });
      await flow.upload({ digest: registerResult.digest });

      setSubmitState({ kind: 'submitting', step: 'Sign certification', subStep: '2 of 2' });
      const certifyTx = flow.certify();
      const certifyResult = await signAndExecute({ transaction: certifyTx });

      const filesUploaded = await flow.listFiles();
      const blobId = filesUploaded[0]?.blobId ?? 'unknown';

      setSubmitted({
        version: '1.0',
        form_id: submissionPayload.form_id,
        form_schema_blob_id: 'blob_schema_pending_publish',
        submitted_at_ms: submissionPayload.submitted_at_ms,
        submitter: account.address,
        values: submissionValues,
        _meta_encrypted_field_ids: encryptedFieldIds,
        _real_blob_id: blobId,
        _real_tx_hash: certifyResult.digest,
      });
      setSubmitState({ kind: 'idle' });
    } catch (e) {
      console.error('Walrus submit failed:', e);
      const msg = (e as Error).message || 'Unknown error';
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

  const hasEncrypted = schema.fields.some(f => f.encrypted);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-2xl items-center gap-3 px-6 text-sm">
          <button
            type="button"
            onClick={onHome}
            className="font-mono text-foreground transition hover:text-muted-foreground"
            title="Back to landing"
          >
            catat
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{schema.title}</span>
          <SurfaceTabs current={surface} onChange={onSurfaceChange} />
          <WalletButton />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">{schema.title}</h1>
          {schema.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{schema.description}</p>
          )}
        </div>

        <div className="space-y-7">
          {schema.fields.map(field => (
            <RunnerField
              key={field.id}
              field={field}
              value={values[field.id]}
              onChange={v => updateValue(field.id, v)}
            />
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-8">
          {submitState.kind === 'error' && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="flex-1">
                <div className="font-medium">Submission failed</div>
                <div className="mt-0.5 font-mono leading-relaxed opacity-80">{submitState.message}</div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isComplete || submitState.kind === 'submitting'}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition',
              isComplete && submitState.kind !== 'submitting' ? 'hover:opacity-90' : 'cursor-not-allowed opacity-50',
            )}
          >
            {submitState.kind === 'submitting' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {submitState.step}
                {submitState.subStep && (
                  <span className="font-mono text-[10px] opacity-70">({submitState.subStep})</span>
                )}
              </>
            ) : !account ? (
              <>
                <Wallet className="h-3.5 w-3.5" /> Connect wallet to submit
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" /> Submit to Walrus
              </>
            )}
          </button>

          <p className="text-center font-mono text-[11px] leading-relaxed text-muted-foreground/70">
            real submit · 2 wallet sigs (reserve + certify) · ~10 epochs storage
            {hasEncrypted && ' · encrypted fields shown as plaintext in this MVP (Seal pending)'}
          </p>
        </div>
      </main>
    </div>
  );
}
