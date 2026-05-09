import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { FormSchema } from '../builder/types';
import SurfaceTabs from '@/components/SurfaceTabs';
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
}

interface Props {
  schema: FormSchema;
  submission: SerializedSubmission;
  onReset: () => void;
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
}

export default function RunnerReview({ schema, submission, onReset, surface, onSurfaceChange }: Props) {
  const [copied, setCopied] = useState(false);

  const { _meta_encrypted_field_ids, ...payload } = submission;
  const submissionJson = JSON.stringify(payload, null, 2);
  const sizeBytes = new Blob([submissionJson]).size;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(submissionJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-3xl items-center gap-3 px-6 text-sm">
          <span className="font-mono text-foreground">catat</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">submission preview</span>
          <span className="ml-auto" />
          <SurfaceTabs current={surface} onChange={onSurfaceChange} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
            <Check className="h-3 w-3" /> Submission ready
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            This is what would go to Walrus
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            In production: bundled into a Quilt with attachments → uploaded to Walrus → blob_id recorded on Sui via{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">catat::form::submit()</code>.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <Stat label="JSON size" value={`${sizeBytes} B`} />
          <Stat
            label="Encrypted fields"
            value={`${_meta_encrypted_field_ids.length} of ${schema.fields.length}`}
          />
          <Stat label="Walrus epochs" value="12" hint="~12 days" />
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
