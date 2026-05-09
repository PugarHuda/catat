import { useState } from 'react';
import LandingPage from './landing/LandingPage';
import BuilderSurface from './builder/BuilderSurface';
import RunnerSurface from './runner/RunnerSurface';
import AdminSurface from './admin/AdminSurface';
import { bugReportTemplate } from './builder/templates';
import { generateMockSubmissions } from './admin/mockSubmissions';
import type { FormSchema } from './builder/types';
import type { Submission } from './admin/types';
import type { Surface } from './lib/surfaces';

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

  if (surface === 'runner') {
    return (
      <RunnerSurface
        schema={schema}
        surface={surface}
        onSurfaceChange={setSurface}
        onHome={onHome}
      />
    );
  }

  if (surface === 'admin') {
    return (
      <AdminSurface
        schema={schema}
        submissions={submissions}
        onSubmissionsChange={setSubmissions}
        surface={surface}
        onSurfaceChange={setSurface}
        onHome={onHome}
      />
    );
  }

  return (
    <BuilderSurface
      schema={schema}
      onSchemaChange={setSchema}
      surface={surface}
      onSurfaceChange={setSurface}
      onHome={onHome}
    />
  );
}
