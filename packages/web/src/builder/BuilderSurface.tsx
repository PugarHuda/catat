import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Plus, Eye, Send } from 'lucide-react';
import type { Field, FieldType, FormSchema } from './types';
import FieldRow from './FieldRow';
import SlashMenu from './SlashMenu';
import { cn } from '@/lib/utils';

interface Props {
  schema: FormSchema;
  onSchemaChange: Dispatch<SetStateAction<FormSchema>>;
  onPreview: () => void;
}

let nextId = 1000;
const newId = () => `f${nextId++}`;

function defaultsForType(type: FieldType): Partial<Field> {
  switch (type) {
    case 'dropdown':       return { label: 'Dropdown',                options: ['Option A', 'Option B', 'Option C'] };
    case 'checkboxes':     return { label: 'Checkboxes',              options: ['Choice 1', 'Choice 2'] };
    case 'star_rating':    return { label: 'How would you rate this?', scale: 5 };
    case 'email':          return { label: 'Email' };
    case 'url':            return { label: 'Link' };
    case 'wallet_address': return { label: 'Wallet address' };
    case 'image_upload':   return { label: 'Screenshots' };
    case 'video_upload':   return { label: 'Video upload' };
    case 'rich_text':      return { label: 'Description' };
    case 'short_text':     return { label: 'Question' };
    case 'number':         return { label: 'Number' };
    case 'date':           return { label: 'Date' };
  }
}

export default function BuilderSurface({ schema, onSchemaChange: setSchema, onPreview }: Props) {
  const [slashOpen, setSlashOpen] = useState(false);
  const slashAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const inEditable =
        t.tagName === 'INPUT' ||
        t.tagName === 'TEXTAREA' ||
        t.isContentEditable;
      if (e.key === '/' && !inEditable && !slashOpen) {
        e.preventDefault();
        setSlashOpen(true);
        slashAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slashOpen]);

  const addField = (type: FieldType) => {
    setSchema(s => ({
      ...s,
      fields: [
        ...s.fields,
        { id: newId(), type, label: 'New field', required: false, ...defaultsForType(type) },
      ],
    }));
    setSlashOpen(false);
  };

  const updateField = (id: string, patch: Partial<Field>) => {
    setSchema(s => ({
      ...s,
      fields: s.fields.map(f => (f.id === id ? { ...f, ...patch } : f)),
    }));
  };

  const removeField = (id: string) => {
    setSchema(s => ({ ...s, fields: s.fields.filter(f => f.id !== id) }));
  };

  const moveField = (id: string, dir: -1 | 1) => {
    setSchema(s => {
      const i = s.fields.findIndex(f => f.id === id);
      if (i < 0) return s;
      const j = i + dir;
      if (j < 0 || j >= s.fields.length) return s;
      const next = [...s.fields];
      const a = next[i]!;
      const b = next[j]!;
      next[i] = b;
      next[j] = a;
      return { ...s, fields: next };
    });
  };

  const encryptedCount = schema.fields.filter(f => f.encrypted).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-3xl items-center gap-3 px-6 text-sm">
          <span className="font-mono text-foreground">catat</span>
          <span className="text-muted-foreground">/</span>
          <input
            value={schema.title}
            onChange={e => setSchema(s => ({ ...s, title: e.target.value }))}
            className="min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-muted-foreground"
            placeholder="Untitled form"
          />
          <span className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-block">
            testnet
          </span>
          <button
            type="button"
            onClick={onPreview}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
          <button
            type="button"
            onClick={onPreview}
            className="flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-primary-foreground transition hover:opacity-90"
          >
            <Send className="h-3.5 w-3.5" /> Publish
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10 space-y-2">
          <input
            value={schema.title}
            onChange={e => setSchema(s => ({ ...s, title: e.target.value }))}
            className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
            placeholder="Form title"
          />
          <textarea
            value={schema.description}
            onChange={e => setSchema(s => ({ ...s, description: e.target.value }))}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/40"
            placeholder="Describe what this form is for"
            rows={2}
          />
        </div>

        <div className="space-y-1">
          {schema.fields.map((field, i) => (
            <FieldRow
              key={field.id}
              field={field}
              index={i}
              total={schema.fields.length}
              onUpdate={patch => updateField(field.id, patch)}
              onRemove={() => removeField(field.id)}
              onMove={dir => moveField(field.id, dir)}
            />
          ))}
        </div>

        <div ref={slashAnchorRef} className="relative mt-4">
          <button
            type="button"
            onClick={() => setSlashOpen(o => !o)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition',
              'hover:border-foreground/30 hover:text-foreground',
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add field</span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
              press <kbd className="rounded border border-border bg-muted px-1 py-px">/</kbd>
            </span>
          </button>

          {slashOpen && (
            <SlashMenu onSelect={addField} onClose={() => setSlashOpen(false)} />
          )}
        </div>

        <p className="mt-16 text-center font-mono text-xs text-muted-foreground/60">
          prototype · {schema.fields.length} fields · {encryptedCount} encrypted · click Preview to fill
        </p>
      </main>
    </div>
  );
}
