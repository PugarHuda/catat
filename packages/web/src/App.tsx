import { lazy, Suspense, useEffect, useState } from 'react';
import LandingPage from './landing/LandingPage';
import { blankCanvasTemplate, bugReportTemplate } from './builder/templates';
import type { FormSchema } from './builder/types';
import type { Submission } from './admin/types';
import type { Surface } from './lib/surfaces';
import { BUG_REPORT_FORM_ID } from './lib/contract';
import { useFormSchema } from './lib/useFormSchema';

const BuilderSurface = lazy(() => import('./builder/BuilderSurface'));
const RunnerSurface = lazy(() => import('./runner/RunnerSurface'));
const InboxSurface = lazy(() => import('./inbox/InboxSurface'));
const AdminSurface = lazy(() => import('./admin/AdminSurface'));
const VerifySurface = lazy(() => import('./verify/VerifySurface'));
const DocsView = lazy(() => import('./docs/DocsView'));

type View = 'landing' | 'app' | 'docs';

/**
 * Read the optional `?f=0x...` form_id from the URL. Use case: a form
 * publisher copies catat-walrus.vercel.app/?f=<their_form_id>&go=submit
 * to share with respondents — opening that link drops the visitor straight
 * into the Runner with their form pre-loaded.
 *
 * Surface override (`?go=`) accepts: builder|submit|inbox|verify.
 */
function parseUrlParams(): { formId?: string; surface?: Surface; embed: boolean } {
  if (typeof window === 'undefined') return { embed: false };
  const sp = new URLSearchParams(window.location.search);
  const f = sp.get('f');
  const formId = f && /^0x[a-fA-F0-9]{64}$/.test(f) ? f : undefined;
  const goParam = sp.get('go');

  // SECURITY: when a formId arrives via the URL, the visitor is in
  // "respondent context" — clicked a share link sent by someone else. They
  // must NOT be able to use ?go= to land in another publisher's Admin /
  // Inbox / Builder where the in-memory schema state from their respondent
  // session would leak into a different surface. We therefore restrict the
  // surface whitelist to runner-only when ?f= is set, regardless of ?go=.
  // ?full=1 is also ignored — embed mode is locked on for share links.
  const fullSurfaceMap: Record<string, Surface> = {
    builder: 'builder',
    submit: 'runner',
    runner: 'runner',
    inbox: 'inbox',
    admin: 'admin',
    verify: 'verify',
  };
  const sharedLinkSurfaceMap: Record<string, Surface> = {
    submit: 'runner',
    runner: 'runner',
  };
  const map = formId ? sharedLinkSurfaceMap : fullSurfaceMap;
  const surface = goParam ? map[goParam.toLowerCase()] : undefined;
  // `?go=docs` routes to the docs viewer instead of an app surface — handled
  // separately in App since docs is its own View, not a Surface.

  // Embed mode is locked on for any share-URL arrival. The legacy `?full=1`
  // override was a phishing risk (let a malicious share URL drop a visitor
  // into the publisher's Admin pretending it's the form they just filled).
  const embed = !!formId;
  return { formId, surface, embed };
}

export default function App() {
  const [view, setView] = useState<View>('landing');
  // Default to blank canvas — Templates gallery auto-opens on first
  // Builder visit anyway, so users see the recipe options up-front. If
  // they close the gallery, they're left with the empty draft to build
  // from scratch (instead of the previously-default Walrus Bug Report).
  const [schema, setSchema] = useState<FormSchema>(blankCanvasTemplate);
  // Local mutable list of submissions seeded as empty. Real on-chain
  // submissions are fetched via useRealSubmissions in AdminSurface.
  // Mocks dropped per user direction — Inbox now reflects actual state.
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [surface, setSurface] = useState<Surface>('builder');
  const [activeFormId, setActiveFormId] = useState<string>(BUG_REPORT_FORM_ID);
  // Respondent mode: hides Builder/Inbox/Verify tabs so people who clicked
  // a share URL only see the form to fill, not the whole CMS.
  const [embedMode, setEmbedMode] = useState<boolean>(false);
  // True only when activeFormId came from a share URL — meaning the local
  // `schema` state is stale and we must fetch from chain. After Builder
  // publishes a form, this stays false because the local `schema` is the
  // schema we just published. Without this guard, publishing would mount
  // SchemaLoading, unmounting BuilderSurface and discarding its
  // publishState — the success modal would never render.
  const [needsRemoteFetch, setNeedsRemoteFetch] = useState<boolean>(false);

  const remoteSchemaQuery = useFormSchema(needsRemoteFetch ? activeFormId : null);

  useEffect(() => {
    const fetched = remoteSchemaQuery.data?.schema;
    if (fetched) {
      setSchema(fetched);
      setNeedsRemoteFetch(false); // local state now matches chain
    }
  }, [remoteSchemaQuery.data]);

  // On first mount, honor a shared `?f=0x...&go=submit` URL by jumping
  // straight into the requested surface with the named form active.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('go') === 'docs') {
        setView('docs');
        return;
      }
    }
    const { formId, surface: targetSurface, embed } = parseUrlParams();
    if (formId) {
      setActiveFormId(formId);
      setNeedsRemoteFetch(true); // URL-supplied form, need to fetch schema
    }
    if (formId || targetSurface) {
      setSurface(targetSurface ?? 'runner');
      setView('app');
      setEmbedMode(embed);
    }
  }, []); // run-once on mount; deps intentionally omitted

  // Prefetch lazy surface chunks once the app is idle — kills the
  // "first click on a tab takes 800ms" perf footgun. Browser will
  // fetch+parse the chunks in background after landing settles, so
  // navigation between surfaces becomes instant on subsequent clicks.
  useEffect(() => {
    if (view === 'landing') return;
    const handle = setTimeout(() => {
      void import('./builder/BuilderSurface');
      void import('./runner/RunnerSurface');
      void import('./inbox/InboxSurface');
      void import('./admin/AdminSurface');
      void import('./verify/VerifySurface');
      void import('./docs/DocsView');
    }, 1500);
    return () => clearTimeout(handle);
  }, [view]);

  // Builder calls this after a successful publish. The local `schema` is
  // already correct for this formId — DON'T trigger a remote fetch.
  const handleFormPublished = (formId: string) => {
    setActiveFormId(formId);
    setNeedsRemoteFetch(false);
  };

  // Picker (in Admin / Builder header) calls this when user switches
  // focused form. For seed form we have the bundled bugReportTemplate —
  // use it directly instead of fetching from chain (the on-chain seed
  // form was created with a placeholder schema_blob_id by the publish
  // workflow). For user-published forms, schema must come from Walrus.
  const handleActiveFormChange = (formId: string) => {
    if (formId === activeFormId) return;
    setActiveFormId(formId);
    if (formId === BUG_REPORT_FORM_ID) {
      setSchema(bugReportTemplate);
      setNeedsRemoteFetch(false);
    } else {
      setNeedsRemoteFetch(true);
    }
  };

  if (view === 'landing') {
    return (
      <LandingPage
        onEnterApp={(targetSurface) => {
          setSurface(targetSurface ?? 'builder');
          setView('app');
        }}
        onOpenDocs={() => setView('docs')}
      />
    );
  }

  const onHome = () => {
    setActiveFormId(BUG_REPORT_FORM_ID);
    setNeedsRemoteFetch(false);
    setEmbedMode(false);
    setView('landing');
  };

  if (view === 'docs') {
    return (
      <Suspense fallback={<SurfaceFallback />}>
        <DocsView onHome={onHome} />
      </Suspense>
    );
  }

  // Loading/error/placeholder views ONLY when we genuinely need to fetch
  // schema from chain (URL-supplied formId, no local schema).
  if (needsRemoteFetch && remoteSchemaQuery.isLoading) {
    return <SchemaLoading formId={activeFormId} />;
  }
  if (needsRemoteFetch && remoteSchemaQuery.isError) {
    return (
      <SchemaError
        formId={activeFormId}
        message={(remoteSchemaQuery.error as Error).message}
        onHome={onHome}
        onRetry={() => remoteSchemaQuery.refetch()}
      />
    );
  }
  if (needsRemoteFetch && remoteSchemaQuery.data && !remoteSchemaQuery.data.schema) {
    return <SchemaPlaceholder formId={activeFormId} meta={remoteSchemaQuery.data.meta} onHome={onHome} />;
  }

  return (
    <Suspense fallback={<SurfaceFallback />}>
      {surface === 'runner' ? (
        <RunnerSurface
          schema={schema}
          activeFormId={activeFormId}
          embedMode={embedMode}
          // Embed escape hatch: respondent finishes submitting via share
          // URL, then wants to make their own form in the same tab. Drop
          // embed lock + jump to Builder. Without this, they had to close
          // the tab and re-visit the root URL.
          onExitEmbed={() => {
            setEmbedMode(false);
            setSurface('builder');
          }}
          surface={surface}
          onSurfaceChange={setSurface}
          onHome={onHome}
        />
      ) : surface === 'inbox' ? (
        <InboxSurface
          surface={surface}
          onSurfaceChange={setSurface}
          onOpenInAdmin={(formId) => {
            handleActiveFormChange(formId);
            setSurface('admin');
          }}
          onHome={onHome}
        />
      ) : surface === 'admin' ? (
        <AdminSurface
          schema={schema}
          activeFormId={activeFormId}
          onActiveFormChange={handleActiveFormChange}
          submissions={submissions}
          onSubmissionsChange={setSubmissions}
          surface={surface}
          onSurfaceChange={setSurface}
          onHome={onHome}
        />
      ) : surface === 'verify' ? (
        <VerifySurface
          surface={surface}
          onSurfaceChange={setSurface}
          onHome={onHome}
        />
      ) : (
        <BuilderSurface
          schema={schema}
          onSchemaChange={setSchema}
          activeFormId={activeFormId}
          onFormPublished={handleFormPublished}
          surface={surface}
          onSurfaceChange={setSurface}
          onHome={onHome}
        />
      )}
    </Suspense>
  );
}

function SchemaLoading({ formId }: { formId: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 24 }}>
      <div style={{ textAlign: 'center', fontFamily: 'var(--body)', color: 'var(--ink-soft)' }}>
        <div style={{ width: 24, height: 24, border: '3px dashed var(--marker-blue)', borderRadius: '50%', animation: 'spin 1.4s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontFamily: 'var(--hand)', fontSize: 22, color: 'var(--marker-blue)' }}>Loading form…</div>
        <div style={{ marginTop: 4, fontFamily: 'var(--mono)', fontSize: 11 }}>{formId.slice(0, 12)}…{formId.slice(-6)}</div>
        <div style={{ marginTop: 8, fontSize: 13 }}>Fetching schema from Walrus + Sui chain.</div>
      </div>
    </div>
  );
}

function SchemaError({ formId, message, onHome, onRetry }: { formId: string; message: string; onHome: () => void; onRetry?: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 24 }}>
      <div style={{ maxWidth: 520, textAlign: 'center', fontFamily: 'var(--body)', color: 'var(--ink)' }}>
        <div style={{ fontFamily: 'var(--hand)', fontSize: 32, color: 'var(--marker-red)' }}>Form not loadable</div>
        <p style={{ marginTop: 8 }}>Couldn&rsquo;t load Form <code style={{ fontFamily: 'var(--mono)' }}>{formId.slice(0, 14)}…</code> from chain.</p>
        <p style={{ color: 'var(--marker-red)', fontSize: 13 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          {onRetry && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>↻ Retry</button>
          )}
          <a
            href={`https://suiscan.xyz/testnet/object/${formId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm"
          >
            View on Suiscan ↗
          </a>
          <button type="button" className="btn btn-sm" onClick={onHome}>← catat home</button>
        </div>
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-soft)' }}>
          If this persists, the Walrus storage epoch for the schema may have expired, or the form ID isn't a real Form.
        </p>
      </div>
    </div>
  );
}

function SchemaPlaceholder({ formId, meta, onHome }: { formId: string; meta: { title: string; submissionCount: number }; onHome: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 24 }}>
      <div style={{ maxWidth: 520, textAlign: 'center', fontFamily: 'var(--body)', color: 'var(--ink)' }}>
        <div style={{ fontFamily: 'var(--hand)', fontSize: 32, color: 'var(--marker-red)' }}>Schema not uploaded yet</div>
        <p style={{ marginTop: 8 }}>
          Form <b>{meta.title}</b> exists on chain ({meta.submissionCount} submission{meta.submissionCount === 1 ? '' : 's'}) but its schema blob hasn&rsquo;t been written yet.
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>The form owner needs to re-publish via Builder to upload the schema JSON to Walrus.</p>
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11, display: 'block', marginTop: 8 }}>{formId.slice(0, 14)}…{formId.slice(-6)}</code>
        <button type="button" className="btn btn-primary btn-sm" onClick={onHome} style={{ marginTop: 12 }}>← back to catat home</button>
      </div>
    </div>
  );
}

function SurfaceFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--hand)', fontSize: 22, color: 'var(--marker-blue)' }}>
        <span style={{
          width: 18, height: 18,
          border: '2.5px dashed var(--marker-blue)',
          borderRadius: '50%',
          animation: 'spin 1.4s linear infinite',
        }} />
        loading surface…
      </div>
    </div>
  );
}
