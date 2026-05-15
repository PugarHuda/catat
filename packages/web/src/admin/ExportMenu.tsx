import { useEffect, useRef, useState } from 'react';
import type { ExportFormat } from './exporters';

interface Props {
  /** Disabled when there's nothing to export. */
  disabled?: boolean;
  onExport: (format: ExportFormat) => void;
}

const FORMATS: Array<{ key: ExportFormat; icon: string; label: string; hint: string }> = [
  { key: 'csv',      icon: '📊', label: 'CSV',      hint: 'Excel / Google Sheets, UTF-8 BOM' },
  { key: 'json',     icon: '⚙️', label: 'JSON',     hint: 'Programmatic — full structure preserved' },
  { key: 'markdown', icon: '📝', label: 'Markdown', hint: 'Presentation-ready report' },
];

/**
 * Dropdown trigger styled like the existing `.export-btn-paper` buttons,
 * with a small chevron + popover showing the three format choices.
 *
 * Closes on outside click, Escape, and after a format is picked. Doesn't
 * trap focus — the trigger is a button so keyboard nav is well-behaved.
 */
export default function ExportMenu({ disabled = false, onExport }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Outside click + Escape to dismiss. We attach handlers only while open
  // to avoid running them on every page click.
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const pick = (format: ExportFormat) => {
    setOpen(false);
    onExport(format);
  };

  return (
    <div ref={wrapRef} className="export-menu-wrap">
      <button
        type="button"
        className="export-btn-paper"
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        title={disabled ? 'No submissions to export' : 'Export submissions in your preferred format'}
      >
        ⬇ export
        <span className="export-chev" aria-hidden>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="export-menu" role="menu">
          {FORMATS.map(f => (
            <button
              key={f.key}
              type="button"
              role="menuitem"
              className="export-menu-item"
              onClick={() => pick(f.key)}
            >
              <span className="emi-icon" aria-hidden>{f.icon}</span>
              <span className="emi-text">
                <b>{f.label}</b>
                <small>{f.hint}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
