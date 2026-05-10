import { useEffect, useRef, useState } from 'react';
import type { FieldType } from './types';
import { fieldMeta, groupOrder, groupLabels } from './fieldMeta';

interface Props {
  onSelect: (type: FieldType) => void;
  onClose: () => void;
}

export default function SlashMenu({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const allEntries = Object.entries(fieldMeta) as Array<[FieldType, (typeof fieldMeta)[FieldType]]>;
  const filtered = query
    ? allEntries.filter(([, m]) => m.label.toLowerCase().includes(query.toLowerCase()))
    : allEntries;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [onClose]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const choice = filtered[activeIdx];
      if (choice) onSelect(choice[0]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const grouped = groupOrder
    .map(g => ({ group: g, items: filtered.filter(([, m]) => m.group === g) }))
    .filter(g => g.items.length > 0);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute', left: 0, right: 0, top: '100%',
        zIndex: 20, marginTop: 6,
        background: 'var(--paper-2)',
        border: '2px solid var(--ink)',
        borderRadius: 8,
        boxShadow: '4px 4px 0 var(--ink)',
        overflow: 'hidden',
        transform: 'rotate(-0.4deg)',
      }}
    >
      <div style={{ padding: '10px 12px', borderBottom: '1.5px dashed var(--line)' }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setActiveIdx(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search field types…"
          style={{
            width: '100%',
            fontFamily: 'var(--hand)', fontSize: 22, color: 'var(--ink)',
            background: 'transparent', border: 0, outline: 0,
            padding: '2px 4px',
            borderBottom: '1.5px solid var(--ink)',
          }}
        />
      </div>

      <div style={{ maxHeight: 360, overflowY: 'auto', padding: 6 }}>
        {grouped.length === 0 && (
          <div style={{ padding: '20px 12px', textAlign: 'center', fontFamily: 'var(--hand)', color: 'var(--pencil)' }}>
            No field type matches &ldquo;{query}&rdquo;
          </div>
        )}
        {grouped.map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 6 }}>
            <div className="palette-section">{groupLabels[group]}</div>
            {items.map(([type, m]) => {
              const idxInFiltered = filtered.findIndex(([t]) => t === type);
              const isActive = idxInFiltered === activeIdx;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onSelect(type)}
                  onMouseEnter={() => setActiveIdx(idxInFiltered)}
                  className="palette-item"
                  style={{
                    width: '100%',
                    background: isActive ? 'var(--postit)' : 'var(--paper)',
                    transform: isActive ? 'translate(-1px, -1px)' : 'none',
                    marginBottom: 4,
                  }}
                >
                  <span className="ico">
                    {type === 'short_text' ? 'Aa' :
                     type === 'rich_text' ? '¶' :
                     type === 'dropdown' ? '◉' :
                     type === 'checkboxes' ? '☑' :
                     type === 'star_rating' ? '★' :
                     type === 'image_upload' ? '📎' :
                     type === 'video_upload' ? '🎬' :
                     type === 'url' ? '🔗' :
                     type === 'email' ? '@' :
                     type === 'wallet_address' ? '◊' :
                     type === 'number' ? '#' :
                     type === 'date' ? '📅' : '?'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--body)', fontSize: 15, color: 'var(--ink)' }}>{m.label}</div>
                    <div style={{ fontFamily: 'var(--type)', fontSize: 10, color: 'var(--pencil)', letterSpacing: '.04em' }}>{m.description}</div>
                  </div>
                  {group === 'web3' && (
                    <span style={{
                      fontFamily: 'var(--type)', fontSize: 9,
                      letterSpacing: '.1em', textTransform: 'uppercase',
                      padding: '2px 6px', borderRadius: 4,
                      background: 'var(--postit-mint)', color: 'var(--marker-green)',
                      border: '1px solid var(--marker-green)',
                    }}>
                      catat
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{
        padding: '6px 12px', borderTop: '1.5px dashed var(--line)',
        background: 'var(--paper-edge)',
        fontFamily: 'var(--type)', fontSize: 10, color: 'var(--pencil)',
        letterSpacing: '.06em',
        display: 'flex', gap: 12,
      }}>
        <span>↑↓ nav</span>
        <span>↵ add</span>
        <span>esc close</span>
      </div>
    </div>
  );
}
