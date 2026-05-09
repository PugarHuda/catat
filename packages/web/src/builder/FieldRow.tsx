import { useState } from 'react';
import { Trash2, ArrowUp, ArrowDown, Lock, Asterisk } from 'lucide-react';
import type { Field } from './types';
import { fieldMeta } from './fieldMeta';
import { cn } from '@/lib/utils';

interface Props {
  field: Field;
  index: number;
  total: number;
  onUpdate: (patch: Partial<Field>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}

export default function FieldRow({ field, index, total, onUpdate, onRemove, onMove }: Props) {
  const [hover, setHover] = useState(false);
  const meta = fieldMeta[field.type];
  const Icon = meta.icon;

  return (
    <div
      className="group relative rounded-md px-3 py-3 transition hover:bg-muted/40"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={cn(
          'absolute right-2 top-2 flex items-center gap-0.5 transition',
          hover ? 'opacity-100' : 'opacity-0',
        )}
      >
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
          title="Move up"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
          title="Move down"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          title="Delete field"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-2 flex items-center gap-2 pr-24">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          value={field.label}
          onChange={e => onUpdate({ label: e.target.value })}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          placeholder="Field label"
        />
        <button
          type="button"
          onClick={() => onUpdate({ required: !field.required })}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider transition',
            field.required
              ? 'bg-foreground/10 text-foreground'
              : 'text-muted-foreground/50 hover:bg-accent hover:text-foreground',
          )}
          title={field.required ? 'Required' : 'Optional — click to require'}
        >
          <Asterisk className="h-2.5 w-2.5" />
          {field.required ? 'Required' : 'Optional'}
        </button>
        <button
          type="button"
          onClick={() => onUpdate({ encrypted: !field.encrypted })}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider transition',
            field.encrypted
              ? 'bg-emerald-500/10 text-emerald-700'
              : 'text-muted-foreground/50 hover:bg-accent hover:text-foreground',
          )}
          title={field.encrypted ? 'Encrypted via Seal — only owner can decrypt' : 'Plaintext — click to encrypt'}
        >
          <Lock className="h-2.5 w-2.5" />
          {field.encrypted ? 'Encrypted' : 'Plain'}
        </button>
      </div>

      <FieldPreview field={field} />

      {field.help && (
        <p className="mt-1.5 pl-6 text-xs text-muted-foreground">{field.help}</p>
      )}
    </div>
  );
}

function FieldPreview({ field }: { field: Field }) {
  const baseInput =
    'pointer-events-none w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground/70';

  switch (field.type) {
    case 'short_text':
    case 'email':
    case 'url':
    case 'wallet_address':
      return (
        <input
          disabled
          placeholder={field.placeholder ?? 'Respondent input'}
          className={baseInput}
        />
      );
    case 'rich_text':
      return (
        <div className={cn(baseInput, 'h-16 italic')}>
          Markdown editor
        </div>
      );
    case 'dropdown':
      return (
        <select disabled className={baseInput}>
          {(field.options ?? []).map(o => (
            <option key={o}>{o}</option>
          ))}
        </select>
      );
    case 'checkboxes':
      return (
        <div className="space-y-1 pl-1">
          {(field.options ?? []).map(o => (
            <label key={o} className="flex items-center gap-2 text-sm text-muted-foreground/70">
              <input type="checkbox" disabled className="pointer-events-none" /> {o}
            </label>
          ))}
        </div>
      );
    case 'star_rating':
      return (
        <div className="flex gap-1 text-lg text-muted-foreground/40">
          {Array.from({ length: field.scale ?? 5 }).map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
      );
    case 'image_upload':
      return (
        <div className={cn(baseInput, 'border-dashed text-center')}>
          Click to upload screenshots — stored as Walrus blobs
        </div>
      );
    case 'video_upload':
      return (
        <div className={cn(baseInput, 'border-dashed text-center')}>
          Click to upload video — stored as Walrus blob
        </div>
      );
    case 'number':
      return <input type="number" disabled placeholder="0" className={baseInput} />;
    case 'date':
      return <input type="date" disabled className={baseInput} />;
  }
}
