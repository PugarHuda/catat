import { lazy, Suspense, useEffect, useState } from 'react';
import LandingPage from './landing/LandingPage';
import { blankCanvasTemplate } from './builder/templates';
import type { FormSchema } from './builder/types';
import type { Submission } from './admin/types';
import type { Surface } from './lib/surfaces';
import { BUG_REPORT_FORM_ID } from './lib/contract';
import { useFormSchema } from './lib/useFormSchema';

const BuilderSurface = lazy(() => import('./builder/BuilderSurface'));
const RunnerSurface = lazy(() => import('./runner/RunnerSurface'));
const AdminSurface = lazy(() => import('./admin/AdminSurface'));
const VerifySurface = lazy(() => import('./verify/VerifySurface'));

type View = 'landing' | 'app';

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
  const surfaceMap: Record<string, Surface> = {
    builder: 'builder',
    submit: 'runner',
    runner: 'runner',
    inbox: 'admin',
    admin: 'admin',
    verify: 'verify',
  };
  const surface = goParam ? surfaceMap[goParam.toLowerCase()] : undefined;
  // Default to embed mode when arriving via share URL — respondents
  // shouldn't see the Builder/Inbox/Verify tabs. Pass ?full=1 to override.
  const embed = !!formId && sp.get('full') !== '1';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Builder calls this after a successful publish. The local `schema` is
  // already correct for this formId — DON'T trigger a remote fetch.
  const handleFormPublished = (formId: string) => {
    setActiveFormId(formId);
    setNeedsRemoteFetch(false);
  };

  if (view === 'landing') {
    return (
      <LandingPage
        onEnterApp={(targetSurface) => {
          setSurface(targetSurface ?? 'builder');
          setView('app');
        }}
      />
    );
  }

  const onHome = () => {
    setActiveFormId(BUG_REPORT_FORM_ID);
    setNeedsRemoteFetch(false);
    setEmbedMode(false);
    setView('landing');
  };

  // Loading/error/placeholder views ONLY when we genuinely need to fetch
  // schema from chain (URL-supplied formId, no local schema).
  if (needsRemoteFetch && remoteSchemaQuery.isLoading) {
    return <SchemaLoading formId={activeFormId} />;
  }
  if (needsRemoteFetch && remoteSchemaQuery.isError) {
    return <SchemaError formId={activeFormId} message={(remoteSchemaQuery.error as Error).message} onHome={onHome} />;
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
          surface={surface}
          onSurfaceChange={setSurface}
          onHome={onHome}
        />
      ) : surface === 'admin' ? (
        <AdminSurface
          schema={schema}
          activeFormId={activeFormId}
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

function SchemaError({ formId, message, onHome }: { formId: string; message: string; onHome: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 24 }}>
      <div style={{ maxWidth: 520, textAlign: 'center', fontFamily: 'var(--body)', color: 'var(--ink)' }}>
        <div style={{ fontFamily: 'var(--hand)', fontSize: 32, color: 'var(--marker-red)' }}>Form not loadable</div>
        <p style={{ marginTop: 8 }}>Couldn&rsquo;t load Form <code style={{ fontFamily: 'var(--mono)' }}>{formId.slice(0, 14)}…</code> from chain.</p>
        <p style={{ color: 'var(--marker-red)', fontSize: 13 }}>{message}</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={onHome} style={{ marginTop: 12 }}>← back to catat home</button>
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
