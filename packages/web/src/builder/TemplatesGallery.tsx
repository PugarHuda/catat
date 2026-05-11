import { useEffect } from 'react';
import { templateRegistry, type TemplateMeta } from './templates';
import type { FormSchema } from './types';

interface Props {
  /** id of the template currently loaded in Builder, used to mark "active". */
  currentSchemaId: string;
  onPick: (schema: FormSchema) => void;
  onClose: () => void;
}

/**
 * Modal gallery of pre-wired form recipes. Picking a card hands the bundled
 * FormSchema back up to BuilderSurface (which sets it via setSchema). The
 * built-in templates are read-only on disk; once loaded into Builder they
 * become a draft the user can edit freely before publishing.
 */
export default function TemplatesGallery({ currentSchemaId, onPick, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="tpl-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tpl-modal" role="dialog" aria-label="Form templates gallery">
        <div className="tpl-stamp">templates</div>

        <header className="tpl-head">
          <h3>Pick a starting point.</h3>
          <p>
            Each template is a real <code>FormSchema</code> — load it, edit, then publish to Walrus.
            Sealed (🔒) fields use Seal client-side encryption.
          </p>
          <button type="button" className="tpl-close" onClick={onClose} aria-label="Close gallery">✕</button>
        </header>

        <div className="tpl-grid">
          {templateRegistry.map(t => (
            <TemplateCard
              key={t.id}
              tpl={t}
              isActive={t.schema.id === currentSchemaId}
              onPick={() => {
                onPick(t.schema);
                onClose();
              }}
            />
          ))}

          <div className="tpl-card tpl-blank">
            <div className="tpl-emoji">＋</div>
            <h4>Blank canvas</h4>
            <p>Start from scratch — same fields are in the palette.</p>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                onPick({
                  id: `tpl_blank_${Date.now()}`,
                  title: 'Untitled form',
                  description: '',
                  fields: [],
                });
                onClose();
              }}
            >
              Start blank →
            </button>
          </div>
        </div>

        <footer className="tpl-foot">
          <span className="kbd">esc</span> to close · {templateRegistry.length} ready-made + 1 blank
        </footer>
      </div>
    </div>
  );
}

function TemplateCard({
  tpl,
  isActive,
  onPick,
}: {
  tpl: TemplateMeta;
  isActive: boolean;
  onPick: () => void;
}) {
  const sealedCount = tpl.schema.fields.filter(f => f.encrypted).length;
  const requiredCount = tpl.schema.fields.filter(f => f.required).length;

  return (
    <button
      type="button"
      className={`tpl-card${isActive ? ' active' : ''}`}
      onClick={onPick}
    >
      <div className="tpl-emoji">{tpl.emoji}</div>
      <h4>{tpl.name}</h4>
      <p>{tpl.description}</p>
      <div className="tpl-stats">
        <span><b>{tpl.schema.fields.length}</b> fields</span>
        <span><b>{requiredCount}</b> required</span>
        {sealedCount > 0 && <span>🔒 <b>{sealedCount}</b> sealed</span>}
      </div>
      {isActive && <div className="tpl-active-tag">currently loaded</div>}
      <span className="tpl-cta">Load →</span>
    </button>
  );
}
