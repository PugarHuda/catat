import { useEffect, useState } from 'react';
import { TEMPLATE_EMOJI_CHOICES } from './customTemplates';
import type { FormSchema } from './types';

interface Props {
  schema: FormSchema;
  onSave: (input: { name: string; emoji: string; description: string }) => void;
  onClose: () => void;
}

/**
 * Modal for saving the current Builder draft as a reusable custom template.
 * Stores per-browser via localStorage (see customTemplates.ts) — not on
 * chain. Users get a name input, a preset-emoji picker, and an optional
 * description override.
 */
export default function SaveTemplateModal({ schema, onSave, onClose }: Props) {
  const [name, setName] = useState(schema.title || '');
  const [emoji, setEmoji] = useState(TEMPLATE_EMOJI_CHOICES[0] ?? '📝');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sealedCount = schema.fields.filter(f => f.encrypted).length;
  const canSave = name.trim().length > 0 && schema.fields.length > 0;

  return (
    <div className="publish-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="save-template-modal" role="dialog" aria-label="Save as template">
        <div className="publish-stamp" style={{ background: 'var(--marker-green)' }}>save template</div>
        <h3>Save this draft as a reusable template.</h3>
        <p>
          Stored in your browser so you can load it again from the Templates gallery.
          To share with others, Publish the form to chain and send the share URL instead.
        </p>

        <div className="set-row">
          <label htmlFor="stm-name">Template name</label>
          <input
            id="stm-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Weekly retro form"
            spellCheck={false}
            autoFocus
          />
        </div>

        <div className="set-row">
          <label>Icon</label>
          <div className="stm-emoji-row">
            {TEMPLATE_EMOJI_CHOICES.map(e => (
              <button
                key={e}
                type="button"
                className={`stm-emoji${emoji === e ? ' on' : ''}`}
                onClick={() => setEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="set-row">
          <label htmlFor="stm-desc">Description (optional)</label>
          <input
            id="stm-desc"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Auto: {N} fields, {sealed} sealed"
            spellCheck={false}
          />
        </div>

        <div className="stm-summary">
          <span><b>{schema.fields.length}</b> fields</span>
          <span><b>{schema.fields.filter(f => f.required).length}</b> required</span>
          {sealedCount > 0 && <span>🔒 <b>{sealedCount}</b> sealed</span>}
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!canSave}
            onClick={() => onSave({ name, emoji: emoji ?? '✨', description })}
          >
            ✓ Save template
          </button>
          <button type="button" className="btn btn-sm" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
