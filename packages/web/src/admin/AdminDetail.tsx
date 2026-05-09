import { useState } from 'react';
import { X, Lock, Calendar, User, Hash, ExternalLink, Check, ChevronRight, ChevronDown } from 'lucide-react';
import type { Field, FormSchema } from '../builder/types';
import type { Submission } from './types';
import { statusMeta, statusOrder } from './statusMeta';
import { cn } from '@/lib/utils';

interface Props {
  schema: FormSchema;
  submission: Submission;
  onUpdate: (patch: Partial<Submission>) => void;
  onClose: () => void;
}

export default function AdminDetail({ schema, submission, onUpdate, onClose }: Props) {
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyValue = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <aside className="overflow-hidden rounded-lg border border-border bg-card xl:sticky xl:top-16 xl:h-[calc(100vh-5rem)] xl:w-96 xl:shrink-0 xl:overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-4 py-2 text-xs">
        <span className="font-mono text-muted-foreground">submission</span>
        <span className="font-mono text-foreground">{submission.id}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          title="Close (esc)"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-5 p-4">
        <section>
          <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Status
          </div>
          <div className="flex flex-wrap gap-1">
            {statusOrder.map(s => {
              const m = statusMeta[s];
              const Icon = m.icon;
              const active = submission.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdate({ status: s })}
                  className={cn(
                    'flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition',
                    active
                      ? 'border-foreground/40 bg-accent text-foreground'
                      : 'border-border text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  <Icon className={cn('h-3 w-3', active && m.color)} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-1.5 rounded-md border border-border bg-muted/30 p-3 font-mono text-[11px]">
          <MetaRow icon={Calendar} label="submitted" value={formatTime(submission.submitted_at_ms)} />
          <MetaRow
            icon={User}
            label="submitter"
            value={submission.submitter ? shorten(submission.submitter, 8, 6) : 'anonymous'}
            onCopy={submission.submitter ? () => copyValue('submitter', submission.submitter!) : undefined}
            copied={copied === 'submitter'}
          />
          <MetaRow
            icon={Hash}
            label="blob_id"
            value={shorten(submission.blob_id, 8, 6)}
            onCopy={() => copyValue('blob_id', submission.blob_id)}
            copied={copied === 'blob_id'}
            link={`https://walruscan.com/testnet/blob/${submission.blob_id.replace('blob_', '')}`}
          />
          <MetaRow
            icon={Hash}
            label="tx_hash"
            value={shorten(submission.tx_hash, 8, 6)}
            onCopy={() => copyValue('tx_hash', submission.tx_hash)}
            copied={copied === 'tx_hash'}
            link={`https://suiscan.xyz/testnet/tx/${submission.tx_hash}`}
          />
        </section>

        <section className="space-y-3">
          {schema.fields.map(f => (
            <div key={f.id}>
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <span>{f.label}</span>
                {f.encrypted && <Lock className="h-2.5 w-2.5 text-emerald-600" />}
              </div>
              <FieldValue field={f} value={submission.values[f.id]} />
            </div>
          ))}
        </section>

        <section>
          <button
            type="button"
            onClick={() => setShowJson(j => !j)}
            className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {showJson ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Raw submission JSON
          </button>
          {showJson && (
            <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-[10px] leading-relaxed">
              {JSON.stringify(submission, null, 2)}
            </pre>
          )}
        </section>
      </div>
    </aside>
  );
}

interface MetaRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
  link?: string;
}

function MetaRow({ icon: Icon, label, value, onCopy, copied, link }: MetaRowProps) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-3 w-3 shrink-0" />
      <span className="w-16 shrink-0 text-[10px] uppercase tracking-wider">{label}</span>
      <span className="min-w-0 flex-1 truncate text-foreground">{value}</span>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="rounded p-0.5 hover:bg-accent"
          title="Copy"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-600" />
          ) : (
            <span className="text-[9px] text-muted-foreground">copy</span>
          )}
        </button>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded p-0.5 hover:bg-accent"
          title="Open in explorer"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

interface AttachmentMeta {
  filename: string;
  size_bytes: number;
  content_type?: string;
}

interface EncryptedValue {
  encrypted: true;
  scheme?: string;
  ciphertext_placeholder?: string;
}

function isEncrypted(v: unknown): v is EncryptedValue {
  return v != null && typeof v === 'object' && (v as { encrypted?: boolean }).encrypted === true;
}

function isAttachmentList(v: unknown): v is AttachmentMeta[] {
  return Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null && 'filename' in v[0];
}

function FieldValue({ field, value }: { field: Field; value: unknown }) {
  if (value == null || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-xs italic text-muted-foreground/60">(empty)</span>;
  }

  if (isEncrypted(value)) {
    return (
      <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2 font-mono text-xs text-emerald-700">
        🔒 {value.ciphertext_placeholder ?? '[encrypted]'}
        <div className="mt-1 text-[10px] text-emerald-700/60">
          scheme: {value.scheme ?? 'seal'} · decrypt requires admin signature
        </div>
      </div>
    );
  }

  if (isAttachmentList(value)) {
    return (
      <ul className="space-y-0.5 font-mono text-xs text-muted-foreground">
        {value.map((f, i) => (
          <li key={i}>
            · {f.filename} ({(f.size_bytes / 1024).toFixed(1)} KB)
          </li>
        ))}
      </ul>
    );
  }

  if (field.type === 'star_rating' && typeof value === 'number') {
    const scale = field.scale ?? 5;
    return (
      <span className="flex items-center gap-1 text-yellow-500">
        {Array.from({ length: scale }).map((_, i) => (
          <span key={i}>{i < value ? '★' : '☆'}</span>
        ))}
        <span className="ml-1 font-mono text-xs text-muted-foreground">
          {value}/{scale}
        </span>
      </span>
    );
  }

  if (field.type === 'url' && typeof value === 'string') {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-xs text-blue-600 underline hover:text-blue-700"
      >
        {value}
      </a>
    );
  }

  if (typeof value === 'string' && value.length > 80) {
    return <p className="whitespace-pre-wrap text-xs leading-relaxed">{value}</p>;
  }

  return <p className="text-xs">{String(value)}</p>;
}

function formatTime(ts: number): string {
  return new Date(ts).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function shorten(s: string, head = 6, tail = 4): string {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}
