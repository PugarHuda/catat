import type { ReactNode } from 'react';

/**
 * Shared rendering primitives for all doc pages. The point of this file is
 * one-source-of-truth styling so every page looks identical without each
 * page reinventing class names.
 */

export function Lead({ children }: { children: ReactNode }) {
  return <p className="docs-lead">{children}</p>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="docs-p">{children}</p>;
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="docs-h2">{children}</h2>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="docs-h3">{children}</h3>;
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="docs-code">{children}</code>;
}

export function Callout({ tone = 'note', children }: { tone?: 'note' | 'tip' | 'warn'; children: ReactNode }) {
  const icon = tone === 'tip' ? '💡' : tone === 'warn' ? '⚠️' : '✏️';
  return (
    <div className={`docs-callout docs-callout-${tone}`}>
      <span className="dc-icon" aria-hidden>{icon}</span>
      <div className="dc-body">{children}</div>
    </div>
  );
}

/**
 * Two-column key/value list. Renders as a styled definition list — keeps
 * "label · description" pairs aligned without falling back to a heavy table.
 */
export function KeyList({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="docs-keylist">
      {items.map(([k, v], i) => (
        <div key={i} className="docs-keylist-row">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Numbered step with a circular badge — used for sequential walkthroughs
 * (publish flow, quick start, etc.).
 */
export function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="docs-step">
      <span className="docs-step-num">{n}</span>
      <div className="docs-step-body">
        <h4 className="docs-step-title">{title}</h4>
        {children}
      </div>
    </div>
  );
}
