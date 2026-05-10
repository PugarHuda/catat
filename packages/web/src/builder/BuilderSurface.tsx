import { useState, type Dispatch, type SetStateAction } from 'react';
import type { Field, FieldType, FormSchema } from './types';
import { fieldMeta, groupOrder, groupLabels } from './fieldMeta';
import FieldRow from './FieldRow';
import SurfaceTabs from '@/components/SurfaceTabs';
import WalletButton from '@/components/WalletButton';
import BrandGlyph from '@/components/BrandGlyph';
import type { Surface } from '@/lib/surfaces';
import { BUG_REPORT_FORM_ID } from '@/lib/contract';

interface Props {
  schema: FormSchema;
  onSchemaChange: Dispatch<SetStateAction<FormSchema>>;
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  onHome?: () => void;
}

let nextId = 1000;
const newId = () => `f${nextId++}`;

function defaultsForType(type: FieldType): Partial<Field> {
  switch (type) {
    case 'dropdown':       return { label: 'Dropdown', options: ['Option A', 'Option B', 'Option C'] };
    case 'checkboxes':     return { label: 'Checkboxes', options: ['Choice 1', 'Choice 2'] };
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

export default function BuilderSurface({ schema, onSchemaChange: setSchema, surface, onSurfaceChange, onHome }: Props) {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(schema.fields[0]?.id ?? null);

  const addField = (type: FieldType) => {
    const id = newId();
    setSchema(s => ({
      ...s,
      fields: [...s.fields, { id, type, label: 'New field', required: false, ...defaultsForType(type) }],
    }));
    setSelectedFieldId(id);
  };

  const updateField = (id: string, patch: Partial<Field>) => {
    setSchema(s => ({
      ...s,
      fields: s.fields.map(f => (f.id === id ? { ...f, ...patch } : f)),
    }));
  };

  const removeField = (id: string) => {
    setSchema(s => ({ ...s, fields: s.fields.filter(f => f.id !== id) }));
    if (selectedFieldId === id) {
      const remaining = schema.fields.filter(f => f.id !== id);
      setSelectedFieldId(remaining[0]?.id ?? null);
    }
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

  const sealedCount = schema.fields.filter(f => f.encrypted).length;
  const selectedField = selectedFieldId ? schema.fields.find(f => f.id === selectedFieldId) ?? null : null;

  return (
    <>
      <header className="nav">
        <div className="wrap nav-row">
          <button type="button" onClick={onHome} className="brand" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
            <BrandGlyph />
            catat
            <small>· builder</small>
          </button>
          <SurfaceTabs current={surface} onChange={onSurfaceChange} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="sheet">
          <div className="sheet-head">
            <span>Builder · draft</span>
            <span className="date">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <h1 style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1, margin: '0 0 8px', color: 'var(--ink)' }}>
            Sketch your <span className="marker">form</span>.
          </h1>
          <p style={{ fontFamily: 'var(--body)', fontSize: 18, color: 'var(--ink-soft)', margin: '0 0 22px', maxWidth: '60ch' }}>
            Pick a field type from the palette, click any card to edit, toggle 🔒 to seal. Schema lives on Walrus, the form is a Sui shared object.
          </p>

          <div className="builder-grid">
            <aside className="palette">
              <h4>Field types</h4>
              <p>tap to add</p>
              <div className="palette-list">
                {groupOrder.map(group => {
                  const items = (Object.entries(fieldMeta) as Array<[FieldType, (typeof fieldMeta)[FieldType]]>)
                    .filter(([, m]) => m.group === group);
                  return (
                    <div key={group}>
                      <div className="palette-section">{groupLabels[group]}</div>
                      {items.map(([type]) => (
                        <button key={type} type="button" className="palette-item" onClick={() => addField(type)}>
                          <span className="ico">{paletteIcon(type)}</span>
                          {fieldMeta[type].label}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </aside>

            <main className="canvas-wrap">
              <div className="form-meta">
                <div className="form-meta-l">
                  <input
                    type="text"
                    className="form-title-input"
                    value={schema.title}
                    onChange={e => setSchema(s => ({ ...s, title: e.target.value }))}
                    spellCheck={false}
                  />
                  <textarea
                    className="form-desc-input"
                    value={schema.description}
                    onChange={e => setSchema(s => ({ ...s, description: e.target.value }))}
                    placeholder="Describe what this form is for"
                    rows={2}
                    spellCheck={false}
                  />
                </div>
                <div className="form-meta-r">
                  FORM ID<br />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)', letterSpacing: 0, textTransform: 'none' }}>
                    {BUG_REPORT_FORM_ID.slice(0, 8)}…{BUG_REPORT_FORM_ID.slice(-4)}
                  </span>
                </div>
              </div>

              <div className="field-stack">
                {schema.fields.map((f, i) => (
                  <FieldRow
                    key={f.id}
                    field={f}
                    index={i + 1}
                    total={schema.fields.length}
                    selected={selectedFieldId === f.id}
                    onSelect={() => setSelectedFieldId(f.id)}
                    onUpdate={patch => updateField(f.id, patch)}
                    onRemove={() => removeField(f.id)}
                    onMove={dir => moveField(f.id, dir)}
                  />
                ))}
                {schema.fields.length === 0 && (
                  <div className="adm-empty">
                    No fields yet. Pick from the palette on the left.
                  </div>
                )}
              </div>

              <div className="publish-bar">
                <div className="left">
                  <b>{schema.fields.length} fields</b>
                  · {sealedCount} sealed · gate off · 10 epochs
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-sm" onClick={() => onSurfaceChange('runner')}>Preview</button>
                  <button type="button" className="btn btn-primary btn-sm" title="Coming soon — schema upload to Walrus">
                    Publish to Walrus →
                  </button>
                </div>
              </div>
            </main>

            <aside className="settings">
              {selectedField ? (
                <div className="set-card selected">
                  <h5>🪶 Field — <span style={{ color: 'var(--marker-red)' }}>{selectedField.type.replace('_', ' ')}</span></h5>
                  <div className="set-row">
                    <label>Question</label>
                    <input
                      type="text"
                      value={selectedField.label}
                      onChange={e => updateField(selectedField.id, { label: e.target.value })}
                    />
                  </div>
                  <div className="set-row">
                    <label>Required</label>
                    <button
                      type="button"
                      className={`toggle${selectedField.required ? ' on' : ''}`}
                      onClick={() => updateField(selectedField.id, { required: !selectedField.required })}
                      aria-label="Toggle required"
                    />
                  </div>
                  <div className="set-row">
                    <label>🔒 Sealed</label>
                    <button
                      type="button"
                      className={`toggle${selectedField.encrypted ? ' on' : ''}`}
                      onClick={() => updateField(selectedField.id, { encrypted: !selectedField.encrypted })}
                      aria-label="Toggle sealed"
                    />
                  </div>
                  {selectedField.encrypted && (
                    <div className="seal-warn">
                      Encrypted client-side. Only the form owner&rsquo;s wallet (2-of-3 Seal threshold) can decrypt — pending Move policy in this MVP.
                    </div>
                  )}
                </div>
              ) : (
                <div className="set-card">
                  <h5>🪶 Click a field</h5>
                  <p style={{ fontFamily: 'var(--body)', fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>
                    Settings for the selected field appear here.
                  </p>
                </div>
              )}

              <div className="set-card">
                <h5>🌐 Form settings</h5>
                <div className="set-row">
                  <label>Token gate</label>
                  <button type="button" className="toggle" aria-label="Toggle token gate" />
                </div>
                <div className="set-row">
                  <label>Epochs</label>
                  <span style={{ fontFamily: 'var(--hand)', fontSize: 22, color: 'var(--ink)' }}>10</span>
                </div>
                <div className="set-row">
                  <label>Public count</label>
                  <button type="button" className="toggle on" aria-label="Toggle public count" />
                </div>
              </div>

              <div className="postit blue" style={{ transform: 'rotate(-2deg)' }}>
                <b>tip</b>
                Click a field card to edit it. Sealed fields render as <code>▒▒▒▒</code> for everyone except you.
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

function paletteIcon(type: FieldType): string {
  switch (type) {
    case 'short_text': return 'Aa';
    case 'rich_text': return '¶';
    case 'dropdown': return '◉';
    case 'checkboxes': return '☑';
    case 'star_rating': return '★';
    case 'image_upload': return '📎';
    case 'video_upload': return '🎬';
    case 'url': return '🔗';
    case 'email': return '@';
    case 'wallet_address': return '◊';
    case 'number': return '#';
    case 'date': return '📅';
  }
}
