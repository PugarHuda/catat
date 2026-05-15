import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Intro } from './pages/Intro';
import { QuickStart } from './pages/QuickStart';
import { Architecture } from './pages/Architecture';
import { BuilderDoc } from './pages/BuilderDoc';
import { SubmittingDoc } from './pages/SubmittingDoc';
import { InboxAdminDoc } from './pages/InboxAdminDoc';
import { VerifyDoc } from './pages/VerifyDoc';
import { SealDoc } from './pages/SealDoc';
import { WalrusDoc } from './pages/WalrusDoc';
import { TemplatesDoc } from './pages/TemplatesDoc';
import { TroubleshootingDoc } from './pages/TroubleshootingDoc';
import BrandGlyph from '@/components/BrandGlyph';

interface Props {
  onHome: () => void;
}

/**
 * In-app docs site, gitbook-style: sticky sidebar with section list +
 * scrollable content area. Each page is a JSX module under ./pages/.
 *
 * Routing: section is mirrored to the URL hash (`#section-id`) so users
 * can deep-link to a section (also useful for "copy link" sharing).
 */

interface DocPage {
  id: string;
  group: string;
  title: string;
  icon: string;
  Component: () => ReactElement;
}

const PAGES: DocPage[] = [
  { id: 'intro',          group: 'Get started',  title: 'What is catat?',    icon: '👋', Component: Intro },
  { id: 'quickstart',     group: 'Get started',  title: 'Quick start',       icon: '⚡', Component: QuickStart },
  { id: 'architecture',   group: 'Concepts',     title: 'Architecture',      icon: '🏗️', Component: Architecture },
  { id: 'walrus',         group: 'Concepts',     title: 'Walrus storage',    icon: '🌊', Component: WalrusDoc },
  { id: 'seal',           group: 'Concepts',     title: 'Seal encryption',   icon: '🔒', Component: SealDoc },
  { id: 'builder',        group: 'Features',     title: 'Form Builder',      icon: '🪶', Component: BuilderDoc },
  { id: 'templates',      group: 'Features',     title: 'Templates',         icon: '📚', Component: TemplatesDoc },
  { id: 'submitting',     group: 'Features',     title: 'Submitting',        icon: '✉️', Component: SubmittingDoc },
  { id: 'admin',          group: 'Features',     title: 'Inbox & Admin',     icon: '📥', Component: InboxAdminDoc },
  { id: 'verify',         group: 'Features',     title: 'Verify (proof)',    icon: '🛡️', Component: VerifyDoc },
  { id: 'troubleshooting',group: 'Reference',    title: 'FAQ & troubleshoot',icon: '❓', Component: TroubleshootingDoc },
];

const groupOrder = ['Get started', 'Concepts', 'Features', 'Reference'];

export default function DocsView({ onHome }: Props) {
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'intro';
    const hash = window.location.hash.replace(/^#/, '');
    return PAGES.some(p => p.id === hash) ? hash : 'intro';
  });

  // Sync URL hash so deep-links work + browser back/forward navigation
  // between docs sections behaves naturally.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== `#${activeId}`) {
      window.history.replaceState(null, '', `#${activeId}`);
    }
  }, [activeId]);

  // Group pages by section for sidebar rendering.
  const grouped = useMemo(() => {
    const out: Record<string, DocPage[]> = {};
    for (const p of PAGES) {
      (out[p.group] ??= []).push(p);
    }
    return out;
  }, []);

  const activePage = PAGES.find(p => p.id === activeId) ?? PAGES[0]!;
  const ActiveComponent = activePage.Component;
  const activeIdx = PAGES.findIndex(p => p.id === activeId);
  const prev = activeIdx > 0 ? PAGES[activeIdx - 1] : null;
  const next = activeIdx < PAGES.length - 1 ? PAGES[activeIdx + 1] : null;

  return (
    <div className="docs-view">
      {/* sticky top bar — brand back to home + page title */}
      <header className="docs-top">
        <button type="button" onClick={onHome} className="docs-brand">
          <BrandGlyph size="sm" />
          catat
          <small>· docs</small>
        </button>
        <span className="docs-active-title">{activePage.icon} {activePage.title}</span>
        <a href="https://github.com/PugarHuda/catat" target="_blank" rel="noopener noreferrer" className="docs-github">
          GitHub ↗
        </a>
      </header>

      <div className="docs-body">
        <nav className="docs-sidebar">
          {groupOrder.map(group => (
            <div key={group} className="docs-group">
              <div className="docs-group-label">{group}</div>
              {grouped[group]?.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={`docs-nav-item${p.id === activeId ? ' active' : ''}`}
                  onClick={() => {
                    setActiveId(p.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <span className="dni-icon">{p.icon}</span>
                  {p.title}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <main className="docs-content">
          <article className="docs-article">
            <ActiveComponent />
          </article>

          <nav className="docs-nav-bottom">
            {prev ? (
              <button type="button" className="dn-prev" onClick={() => { setActiveId(prev.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <span className="dn-arrow">←</span>
                <span className="dn-stack">
                  <small>previous</small>
                  <b>{prev.title}</b>
                </span>
              </button>
            ) : <span />}
            {next ? (
              <button type="button" className="dn-next" onClick={() => { setActiveId(next.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <span className="dn-stack">
                  <small>next</small>
                  <b>{next.title}</b>
                </span>
                <span className="dn-arrow">→</span>
              </button>
            ) : <span />}
          </nav>
        </main>
      </div>
    </div>
  );
}
