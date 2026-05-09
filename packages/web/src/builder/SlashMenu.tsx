import { useEffect, useRef, useState } from 'react';
import type { FieldType } from './types';
import { fieldMeta, groupOrder, groupLabels } from './fieldMeta';
import { cn } from '@/lib/utils';

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
    .map(g => ({
      group: g,
      items: filtered.filter(([, m]) => m.group === g),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div
      ref={menuRef}
      className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-xl"
    >
      <div className="border-b border-border px-3 py-2">
        <input
          ref={inputRef}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setActiveIdx(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search field types..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="max-h-80 overflow-y-auto p-1">
        {grouped.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No field type matches "{query}"
          </div>
        )}

        {grouped.map(({ group, items }) => (
          <div key={group} className="mb-1">
            <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {groupLabels[group]}
            </div>
            {items.map(([type, m]) => {
              const idxInFiltered = filtered.findIndex(([t]) => t === type);
              const isActive = idxInFiltered === activeIdx;
              const Icon = m.icon;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onSelect(type)}
                  onMouseEnter={() => setActiveIdx(idxInFiltered)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-sm transition',
                    isActive ? 'bg-accent text-accent-foreground' : 'text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{m.label}</div>
                    <div className="truncate text-xs text-muted-foreground">{m.description}</div>
                  </div>
                  {group === 'web3' && (
                    <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-700">
                      catat
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-border bg-muted/40 px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
        <span>
          <kbd className="rounded border border-border bg-background px-1 py-px">↑↓</kbd> nav
        </span>
        <span>
          <kbd className="rounded border border-border bg-background px-1 py-px">↵</kbd> add
        </span>
        <span>
          <kbd className="rounded border border-border bg-background px-1 py-px">esc</kbd> close
        </span>
      </div>
    </div>
  );
}
