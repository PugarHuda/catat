import { lazy, Suspense, useState } from 'react';
import LandingPage from './landing/LandingPage';
import { bugReportTemplate } from './builder/templates';
import { generateMockSubmissions } from './admin/mockSubmissions';
import type { FormSchema } from './builder/types';
import type { Submission } from './admin/types';
import type { Surface } from './lib/surfaces';

const BuilderSurface = lazy(() => import('./builder/BuilderSurface'));
const RunnerSurface = lazy(() => import('./runner/RunnerSurface'));
const AdminSurface = lazy(() => import('./admin/AdminSurface'));
const VerifySurface = lazy(() => import('./verify/VerifySurface'));

type View = 'landing' | 'app';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [schema, setSchema] = useState<FormSchema>(bugReportTemplate);
  const [submissions, setSubmissions] = useState<Submission[]>(() => generateMockSubmissions());
  const [surface, setSurface] = useState<Surface>('builder');

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

  const onHome = () => setView('landing');

  return (
    <Suspense fallback={<SurfaceFallback />}>
      {surface === 'runner' ? (
        <RunnerSurface
          schema={schema}
          surface={surface}
          onSurfaceChange={setSurface}
          onHome={onHome}
        />
      ) : surface === 'admin' ? (
        <AdminSurface
          schema={schema}
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
