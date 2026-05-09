import { Lock } from 'lucide-react';
import type { Field } from '../builder/types';
import { fieldMeta } from '../builder/fieldMeta';
import { cn } from '@/lib/utils';

export type Values = Record<string, unknown>;

interface Props {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}

const baseInput =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm transition focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/10';

export default function RunnerField({ field, value, onChange }: Props) {
  const meta = fieldMeta[field.type];
  const Icon = meta.icon;

  return (
    <div>
      <label className="mb-2 flex items-baseline gap-1.5">
        <Icon className="relative top-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium">{field.label}</span>
        {field.required && <span className="text-xs text-destructive">*</span>}
        {field.encrypted && (
          <span className="ml-auto inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700">
            <Lock className="h-2.5 w-2.5" /> Encrypted
          </span>
        )}
      </label>
      {field.help && <p className="mb-2 pl-5 text-xs text-muted-foreground">{field.help}</p>}
      <div className="pl-5">
        <RunnerInput field={field} value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function RunnerInput({ field, value, onChange }: Props) {
  switch (field.type) {
    case 'short_text':
      return (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          className={baseInput}
        />
      );

    case 'wallet_address':
      return (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="0x... (will autofill from connected wallet)"
          className={cn(baseInput, 'font-mono text-xs')}
        />
      );

    case 'email':
      return (
        <input
          type="email"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="you@example.com"
          className={baseInput}
        />
      );

    case 'url':
      return (
        <input
          type="url"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="https://"
          className={baseInput}
        />
      );

    case 'rich_text':
      return (
        <textarea
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          rows={5}
          placeholder="Markdown supported — # heading, **bold**, [link](url)"
          className={cn(baseInput, 'resize-y leading-relaxed')}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value == null ? '' : String(value)}
          onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className={baseInput}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          className={baseInput}
        />
      );

    case 'dropdown':
      return (
        <select
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          className={baseInput}
        >
          <option value="" disabled>Select…</option>
          {(field.options ?? []).map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );

    case 'checkboxes': {
      const arr = (value as string[]) ?? [];
      return (
        <div className="space-y-1.5">
          {(field.options ?? []).map(o => (
            <label key={o} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={arr.includes(o)}
                onChange={e =>
                  onChange(e.target.checked ? [...arr, o] : arr.filter(x => x !== o))
                }
                className="h-3.5 w-3.5 rounded border-border"
              />
              {o}
            </label>
          ))}
        </div>
      );
    }

    case 'star_rating': {
      const num = (value as number) ?? 0;
      const scale = field.scale ?? 5;
      return (
        <div className="flex items-center gap-1">
          {Array.from({ length: scale }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(num === i + 1 ? 0 : i + 1)}
              className={cn(
                'text-2xl leading-none transition',
                i < num ? 'text-yellow-500' : 'text-muted-foreground/30 hover:text-yellow-300',
              )}
              aria-label={`${i + 1} of ${scale}`}
            >
              ★
            </button>
          ))}
          {num > 0 && (
            <span className="ml-2 self-center font-mono text-xs text-muted-foreground">
              {num}/{scale}
            </span>
          )}
        </div>
      );
    }

    case 'image_upload':
    case 'video_upload': {
      const files = (value as File[]) ?? [];
      const accept = field.type === 'image_upload' ? 'image/*' : 'video/*';
      const multiple = field.type === 'image_upload';
      return (
        <div>
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={e => onChange(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
          />
          {files.length > 0 && (
            <ul className="mt-2 space-y-0.5 font-mono text-xs text-muted-foreground">
              {files.map((f, i) => (
                <li key={i}>· {f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
              ))}
            </ul>
          )}
        </div>
      );
    }
  }
}
