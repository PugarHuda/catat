import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import type { FormSchema } from '../builder/types';
import SurfaceTabs from '@/components/SurfaceTabs';
import WalletButton from '@/components/WalletButton';
import type { Surface } from '@/lib/surfaces';
import { cn } from '@/lib/utils';

export interface SerializedSubmission {
  version: string;
  form_id: string;
  form_schema_blob_id: string;
  submitted_at_ms: number;
  submitter: string;
  values: Record<string, unknown>;
  _meta_encrypted_field_ids: string[];
  /** Real Walrus blob ID returned after upload (only present after a real submit) */
  _real_blob_id?: string;
  /** Real Sui tx hash from catat::form::submit (the registry record) */
  _real_tx_hash?: string;
  /** Real Sui tx hash from Walrus certify (kept for transparency) */
  _real_walrus_certify_tx?: string;
  /** On-chain Form object that recorded this submission */
  _real_form_id?: string;
}

interface Props {
  schema: FormSchema;
  submission: SerializedSubmission;
  onReset: () => void;
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  onHome?: () => void;
}

export default function RunnerReview({ schema, submission, onReset, surface, onSurfaceChange, onHome }: Props) {
  const [copied, setCopied] = useState(false);

  const {
    _meta_encrypted_field_ids,
    _real_blob_id,
    _real_tx_hash,
    _real_walrus_certify_tx,
    _real_form_id,
    ...payload
  } = submission;
  const submissionJson = JSON.stringify(payload, null, 2);
  const sizeBytes = new Blob([submissionJson]).size;
  const isReal = Boolean(_real_blob_id);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(submissionJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-3xl items-center gap-3 px-6 text-sm">
          <button
            type="button"
            onClick={onHome}
            className="font-mono text-foreground transition hover:text-muted-foreground"
            title="Back to landing"
          >
            catat
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {isReal ? 'submission stored on walrus' : 'submission preview'}
          </span>
          <SurfaceTabs current={surface} onChange={onSurfaceChange} />
          <WalletButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
            <Check className="h-3 w-3" />
            {isReal ? 'Stored on Walrus testnet ✓' : 'Submission ready'}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {isReal ? 'Your submission is now on-chain.' : 'This is what would go to Walrus'}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {isReal ? (
              <>
                Submission JSON uploaded as a Walrus blob, certified via Sui transaction. Anyone can verify the blob existence + content addressing on Walruscan.
              </>
            ) : (
              <>
                In production: bundled into a Quilt with attachments → uploaded to Walrus → blob_id recorded on Sui via{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">catat::form::submit()</code>.
              </>
            )}
          </p>
        </div>

        {isReal && _real_blob_id && _real_tx_hash && (
          <div className="mb-6 grid gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 sm:grid-cols-2">
            <ExplorerRow
              label="walrus blob_id"
              value={_real_blob_id}
              href={`https://walruscan.com/testnet/blob/${_real_blob_id.replace(/^blob_/, '')}`}
            />
            <ExplorerRow
              label="sui registry tx"
              value={_real_tx_hash}
              href={`https://suiscan.xyz/testnet/tx/${_real_tx_hash}`}
            />
            {_real_form_id && (
              <ExplorerRow
                label="form object"
                value={_real_form_id}
                href={`https://suiscan.xyz/testnet/object/${_real_form_id}`}
              />
            )}
            {_real_walrus_certify_tx && (
              <ExplorerRow
                label="walrus certify tx"
                value={_real_walrus_certify_tx}
                href={`https://suiscan.xyz/testnet/tx/${_real_walrus_certify_tx}`}
              />
            )}
          </div>
        )}

        <div className="mb-4 grid grid-cols-3 gap-3">
          <Stat label="JSON size" value={`${sizeBytes} B`} />
          <Stat
            label="Encrypted fields"
            value={`${_meta_encrypted_field_ids.length} of ${schema.fields.length}`}
          />
          <Stat label="Walrus epochs" value="10" hint={isReal ? 'live' : '~10 days'} />
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              submission.json
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'copied' : 'copy'}
            </button>
          </div>
          <pre className="overflow-x-auto bg-background p-4 font-mono text-xs leading-relaxed">
            {submissionJson}
          </pre>
        </div>

        {_meta_encrypted_field_ids.length > 0 && (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
            🔒 Encrypted: {_meta_encrypted_field_ids.join(', ')} — actual ciphertext via{' '}
            <code className="rounded bg-muted px-1 py-px">@mysten/seal</code> threshold 2-of-3 in production
          </p>
        )}

        <div className="mt-10 flex gap-3">
          <button
            type="button"
            onClick={onReset}
            className={cn(
              'rounded-md border border-border px-3 py-1.5 text-sm transition',
              'hover:bg-accent hover:text-accent-foreground',
            )}
          >
            Submit another
          </button>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="font-mono text-sm">{value}</span>
        {hint && <span className="font-mono text-[10px] text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

function ExplorerRow({ label, value, href }: { label: string; value: string; href: string }) {
  const short = value.length > 20 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-2 rounded-md border border-border bg-background p-2.5 transition hover:border-emerald-500/40"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-700">{label}</div>
        <div className="mt-0.5 truncate font-mono text-xs">{short}</div>
      </div>
      <ExternalLink className="mt-1 h-3 w-3 text-muted-foreground transition group-hover:text-foreground" />
    </a>
  );
}
