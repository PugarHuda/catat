import { useEffect, useMemo } from 'react';
import { templateRegistry, type TemplateMeta } from './templates';
import { loadCustomTemplates, deleteCustomTemplate, type CustomTemplate } from './customTemplates';
import type { FormSchema } from './types';

interface Props {
  /** id of the template currently loaded in Builder, used to mark "active". */
  currentSchemaId: string;
  /** Bumped by parent every time a custom template is added/deleted so
   *  this component re-reads from localStorage. Pure cache-bust signal. */
  customTplVersion?: number;
  /** Called after a custom template is deleted so parent can bump version. */
  onCustomTplDeleted?: () => void;
  onPick: (schema: FormSchema) => void;
  onClose: () => void;
}

/**
 * Modal gallery of pre-wired form recipes. Picking a card hands the bundled
 * FormSchema back up to BuilderSurface (which sets it via setSchema). The
 * built-in templates are read-only on disk; once loaded into Builder they
 * become a draft the user can edit freely before publishing.
 */
export default function TemplatesGallery({
  currentSchemaId,
  customTplVersion = 0,
  onCustomTplDeleted,
  onPick,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Re-read user templates whenever the cache-bust version changes.
  const customTemplates = useMemo(
    () => loadCustomTemplates(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customTplVersion],
  );

  return (
    <div className="tpl-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Shell handles the box-shadow, border, transform AND hosts the
          absolutely-positioned stamp. Inner .tpl-modal-content owns the
          scroll behavior — split because overflow-y:auto would clip the
          stamp that pokes above the modal's top edge. */}
      <div className="tpl-shell" role="dialog" aria-label="Form templates gallery">
        <div className="tpl-stamp">templates</div>

        <div className="tpl-modal-content">
          <header className="tpl-head">
            <h3>Pick a starting point.</h3>
            <p>
              Each template is a real <code>FormSchema</code> — load it, edit, then publish to Walrus.
              Sealed (🔒) fields use Seal client-side encryption.
            </p>
            <button type="button" className="tpl-close" onClick={onClose} aria-label="Close gallery">✕</button>
          </header>

          {customTemplates.length > 0 && (
            <>
              <div className="tpl-section-label">📦 your templates</div>
              <div className="tpl-grid">
                {customTemplates.map(t => (
                  <CustomTemplateCard
                    key={t.id}
                    tpl={t}
                    isActive={t.schema.id === currentSchemaId}
                    onPick={() => {
                      onPick(t.schema);
                      onClose();
                    }}
                    onDelete={() => {
                      if (confirm(`Delete template "${t.name}"?`)) {
                        deleteCustomTemplate(t.id);
                        onCustomTplDeleted?.();
                      }
                    }}
                  />
                ))}
              </div>
              <div className="tpl-section-label" style={{ marginTop: 20 }}>📚 ready-made</div>
            </>
          )}

          <div className="tpl-grid">
            {/* Blank canvas first — many users start from scratch and were
                scrolling past 12 templates to find this. */}
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
          </div>

          <footer className="tpl-foot">
            <span className="kbd">esc</span> to close · {templateRegistry.length} ready-made + 1 blank
            {customTemplates.length > 0 && <> · {customTemplates.length} yours</>}
          </footer>
        </div>
      </div>
    </div>
  );
}

function CustomTemplateCard({
  tpl,
  isActive,
  onPick,
  onDelete,
}: {
  tpl: CustomTemplate;
  isActive: boolean;
  onPick: () => void;
  onDelete: () => void;
}) {
  const sealedCount = tpl.schema.fields.filter(f => f.encrypted).length;
  const requiredCount = tpl.schema.fields.filter(f => f.required).length;
  const ageDays = Math.floor((Date.now() - tpl.createdAtMs) / 86_400_000);
  const ageLabel = ageDays === 0 ? 'today' : ageDays === 1 ? 'yesterday' : `${ageDays}d ago`;

  return (
    <div className={`tpl-card tpl-custom${isActive ? ' active' : ''}`}>
      <button
        type="button"
        className="tpl-delete"
        onClick={e => { e.stopPropagation(); onDelete(); }}
        aria-label="Delete this template"
        title="Delete template (browser-local only)"
      >
        ✕
      </button>
      <button type="button" className="tpl-card-inner" onClick={onPick}>
        <div className="tpl-emoji">{tpl.emoji}</div>
        <h4>{tpl.name}</h4>
        <p>{tpl.description}</p>
        <div className="tpl-stats">
          <span><b>{tpl.schema.fields.length}</b> fields</span>
          <span><b>{requiredCount}</b> required</span>
          {sealedCount > 0 && <span>🔒 <b>{sealedCount}</b> sealed</span>}
          <span className="tpl-age">saved {ageLabel}</span>
        </div>
        {isActive && <div className="tpl-active-tag">currently loaded</div>}
        <span className="tpl-cta">Load →</span>
      </button>
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
