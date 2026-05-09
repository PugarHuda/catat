import { useState } from 'react';
import { Send } from 'lucide-react';
import type { FormSchema } from '../builder/types';
import RunnerField, { type Values } from './RunnerField';
import RunnerReview, { type SerializedSubmission } from './RunnerReview';
import SurfaceTabs from '@/components/SurfaceTabs';
import type { Surface } from '@/lib/surfaces';
import { cn } from '@/lib/utils';

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

export default function RunnerSurface({ schema, surface, onSurfaceChange, onHome }: Props) {
  const [values, setValues] = useState<Values>({});
  const [submitted, setSubmitted] = useState<SerializedSubmission | null>(null);

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

  const handleSubmit = () => {
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
          scheme: 'seal-ibe-2of3',
          ciphertext_placeholder: `[Seal-encrypted: ~${previewSize} bytes]`,
        };
      } else {
        submissionValues[f.id] = serialized ?? null;
      }
    }

    setSubmitted({
      version: '1.0',
      form_id: '0xtest_form_object_id_will_come_from_sui',
      form_schema_blob_id: 'blob_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      submitted_at_ms: Date.now(),
      submitter: '0xrespondent_wallet_address_when_connected',
      values: submissionValues,
      _meta_encrypted_field_ids: encryptedFieldIds,
    });
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
          <span className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-block">
            respondent view
          </span>
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
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isComplete}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition',
              isComplete ? 'hover:opacity-90' : 'cursor-not-allowed opacity-50',
            )}
          >
            <Send className="h-3.5 w-3.5" /> Submit
          </button>
          <p className="text-center font-mono text-[11px] leading-relaxed text-muted-foreground/70">
            on submit · bundle into Walrus Quilt → record blob_id on Sui
            {hasEncrypted && ' · encrypted fields via Seal threshold 2-of-3'}
          </p>
        </div>
      </main>
    </div>
  );
}
