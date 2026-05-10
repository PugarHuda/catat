import type { Field } from './types';

interface Props {
  field: Field;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<Field>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}

export default function FieldRow({ field, index, total, selected, onSelect, onUpdate, onRemove, onMove }: Props) {
  return (
    <div
      className={`field-card${selected ? ' selected' : ''}${field.encrypted ? ' sealed' : ''}`}
      onClick={onSelect}
    >
      <span className="grip" aria-hidden>⋮⋮</span>
      <div className="field-card-h">
        <div className="label-line">
          <span className="qnum">Q{index}.</span>
          <span>{field.type.replace('_', ' ')}</span>
          {field.encrypted && (
            <span className="lock-tag">
              <LockIcon />
              sealed
            </span>
          )}
        </div>
        <div className="field-card-actions" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onMove(-1)}
            disabled={index === 1}
            title="Move up"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onMove(1)}
            disabled={index === total}
            title="Move down"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            className={`icon-btn${field.encrypted ? ' lock-on' : ''}`}
            onClick={() => onUpdate({ encrypted: !field.encrypted })}
            title={field.encrypted ? 'Unseal' : 'Seal (encrypt with Seal)'}
          >
            <LockIcon open={!field.encrypted} />
          </button>
          <button type="button" className="icon-btn" onClick={onRemove} title="Delete field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
            </svg>
          </button>
        </div>
      </div>

      <input
        type="text"
        className="field-q-edit"
        value={field.label}
        onChange={e => onUpdate({ label: e.target.value })}
        onClick={e => e.stopPropagation()}
        placeholder="Field label"
        spellCheck={false}
      />

      <div className="field-preview">
        <FieldPreview field={field} />
      </div>

      <div className="field-meta">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onUpdate({ required: !field.required });
          }}
          style={{
            background: 'none', border: 0, cursor: 'pointer',
            fontFamily: 'var(--type)', fontSize: 11, letterSpacing: '.06em',
            color: field.required ? 'var(--marker-red)' : 'var(--pencil)',
          }}
        >
          {field.required ? 'required ✓' : 'optional'}
        </button>
        <span>id · field/{field.id}</span>
      </div>
    </div>
  );
}

function LockIcon({ open = false }: { open?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      {open ? <path d="M8 11V7a4 4 0 0 1 8 0V11" /> : <path d="M8 11V7a4 4 0 0 1 8 0v4" />}
    </svg>
  );
}

function FieldPreview({ field }: { field: Field }) {
  if (field.encrypted) {
    return <div className="placeholder">▒▒▒▒-▒▒▒▒-▒▒-▒▒▒▒▒▒▒</div>;
  }

  switch (field.type) {
    case 'short_text':
    case 'email':
    case 'wallet_address':
    case 'number':
    case 'date':
      return <div className="placeholder">{field.placeholder ?? '…'}</div>;
    case 'url':
      return <div className="placeholder">https://…</div>;
    case 'rich_text':
      return <div className="placeholder box">Markdown editor area…</div>;
    case 'dropdown':
      return (
        <>
          {(field.options ?? []).map(o => (
            <span key={o} className="opt-prev">{o}</span>
          ))}
        </>
      );
    case 'checkboxes':
      return (
        <>
          {(field.options ?? []).map(o => (
            <span key={o} className="opt-prev multi">{o}</span>
          ))}
        </>
      );
    case 'star_rating': {
      const scale = field.scale ?? 5;
      return (
        <div style={{ display: 'flex', gap: 4, color: 'var(--pencil)' }}>
          {Array.from({ length: scale }).map((_, i) => (
            <span key={i} style={{ fontSize: 24 }}>★</span>
          ))}
        </div>
      );
    }
    case 'image_upload':
      return <div className="placeholder box">📎 drop screenshots / png / jpg</div>;
    case 'video_upload':
      return <div className="placeholder box">🎬 drop video / mp4 (sealed-friendly)</div>;
  }
}
