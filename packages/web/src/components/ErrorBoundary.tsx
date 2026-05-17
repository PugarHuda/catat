import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional label for which part of the app this boundary wraps —
   *  shown in the fallback so users/devs know what failed. */
  surface?: string;
  /** When true, render a compact inline fallback instead of the
   *  full-screen one. Used for per-surface boundaries so a single
   *  surface crash doesn't take over the whole viewport. */
  inline?: boolean;
}

interface State {
  error: Error | null;
}

/**
 * React error boundary — the only place in a modern React codebase that
 * still must be a class component (`getDerivedStateFromError` /
 * `componentDidCatch` have no hook equivalent).
 *
 * Catches render-phase errors in the subtree: malformed schema slipping
 * past validation, an SDK throw during render, a corrupt blob, or — most
 * usefully — a `React.lazy` chunk that fails to download (Suspense alone
 * does NOT handle chunk-load rejection; it needs a boundary around it).
 *
 * Without this, any such error blanks the entire app to a white void
 * with zero feedback. With it, the user sees a recoverable error card.
 */
export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to the console for debugging. A production app would also
    // ship this to Sentry/LogRocket here — out of scope for the hackathon,
    // but this is the hook point.
    console.error(`[ErrorBoundary${this.props.surface ? ` · ${this.props.surface}` : ''}]`, error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  private reload = () => {
    window.location.reload();
  };

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { surface, inline } = this.props;
    // A chunk-load failure has a recognizable message — offer a reload as
    // the primary action since a fresh fetch usually resolves it (stale
    // deploy, transient network blip).
    const isChunkError = /loading chunk|dynamically imported module|failed to fetch/i.test(error.message);

    if (inline) {
      return (
        <div className="errbound errbound-inline">
          <div className="eb-icon" aria-hidden>⚠️</div>
          <div className="eb-body">
            <b>{surface ? `The ${surface} view hit an error.` : 'This view hit an error.'}</b>
            <span>{isChunkError ? 'A code chunk failed to load — usually a stale tab after a new deploy.' : error.message.slice(0, 160)}</span>
            <div className="eb-actions">
              <button type="button" className="btn btn-sm btn-primary" onClick={this.reload}>↻ Reload page</button>
              <button type="button" className="btn btn-sm" onClick={this.reset}>Try again</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="errbound errbound-full">
        <div className="eb-card">
          <div className="eb-stamp">oops</div>
          <h2>Something broke.</h2>
          <p>
            {isChunkError ? (
              <>
                catat couldn&rsquo;t load part of its code. This usually means the tab is
                stale after a new deploy — a reload fixes it.
              </>
            ) : (
              <>
                An unexpected error stopped this screen from rendering. Your on-chain
                data is safe — nothing here writes to Walrus or Sui.
              </>
            )}
          </p>
          <details className="eb-detail">
            <summary>error detail</summary>
            <code>{error.name}: {error.message}</code>
          </details>
          <div className="eb-actions">
            <button type="button" className="btn btn-primary" onClick={this.reload}>↻ Reload catat</button>
            <a href="/" className="btn">← Home</a>
          </div>
          <small className="eb-foot">
            If this keeps happening, file it on{' '}
            <a href="https://github.com/PugarHuda/catat/issues" target="_blank" rel="noopener noreferrer">GitHub</a>.
          </small>
        </div>
      </div>
    );
  }
}
