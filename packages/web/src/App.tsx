import { lazy, Suspense, useEffect, useState } from 'react';
import LandingPage from './landing/LandingPage';
import { bugReportTemplate } from './builder/templates';
import { generateMockSubmissions } from './admin/mockSubmissions';
import type { FormSchema } from './builder/types';
import type { Submission } from './admin/types';
import type { Surface } from './lib/surfaces';
import { BUG_REPORT_FORM_ID } from './lib/contract';

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
function parseUrlParams(): { formId?: string; surface?: Surface } {
  if (typeof window === 'undefined') return {};
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
  return { formId, surface };
}

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [schema, setSchema] = useState<FormSchema>(bugReportTemplate);
  const [submissions, setSubmissions] = useState<Submission[]>(() => generateMockSubmissions());
  const [surface, setSurface] = useState<Surface>('builder');
  // The form_id that Runner submits into and Admin reads from.
  // Defaults to the seed form (owned by the deploy wallet, decrypt always denied).
  // Builder Publish overrides it with a wallet-owned form so the decrypt loop closes.
  const [activeFormId, setActiveFormId] = useState<string>(BUG_REPORT_FORM_ID);

  // On first mount, honor a shared `?f=0x...&go=submit` URL by jumping
  // straight into the requested surface with the named form active.
  useEffect(() => {
    const { formId, surface: targetSurface } = parseUrlParams();
    if (formId) setActiveFormId(formId);
    if (formId || targetSurface) {
      setSurface(targetSurface ?? 'runner');
      setView('app');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (view === 'landing') {
    return (
      <LandingPage
        onEnterApp={() => {
          setSurface('builder');
          setView('app');
        }}
      />
    );
  }

  const onHome = () => {
    setActiveFormId(BUG_REPORT_FORM_ID);
    setView('landing');
  };

  return (
    <Suspense fallback={<SurfaceFallback />}>
      {surface === 'runner' ? (
        <RunnerSurface
          schema={schema}
          activeFormId={activeFormId}
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
          onFormPublished={setActiveFormId}
          surface={surface}
          onSurfaceChange={setSurface}
          onHome={onHome}
        />
      )}
    </Suspense>
  );
}

function SurfaceFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--hand)', fontSize: 22, color: 'var(--marker-red)' }}>
        <span style={{
          width: 18, height: 18,
          border: '2.5px dashed var(--marker-red)',
          borderRadius: '50%',
          animation: 'spin 1.4s linear infinite',
        }} />
        loading surface…
      </div>
    </div>
  );
}
