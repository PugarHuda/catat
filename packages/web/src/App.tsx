import { useState } from 'react';
import BuilderSurface from './builder/BuilderSurface';
import RunnerSurface from './runner/RunnerSurface';
import AdminSurface from './admin/AdminSurface';
import { bugReportTemplate } from './builder/templates';
import { generateMockSubmissions } from './admin/mockSubmissions';
import type { FormSchema } from './builder/types';
import type { Submission } from './admin/types';
import type { Surface } from './lib/surfaces';

export default function App() {
  const [schema, setSchema] = useState<FormSchema>(bugReportTemplate);
  const [submissions, setSubmissions] = useState<Submission[]>(() => generateMockSubmissions());
  const [surface, setSurface] = useState<Surface>('builder');

  if (surface === 'runner') {
    return (
      <RunnerSurface
        schema={schema}
        surface={surface}
        onSurfaceChange={setSurface}
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
      />
    );
  }

  return (
    <BuilderSurface
      schema={schema}
      onSchemaChange={setSchema}
      surface={surface}
      onSurfaceChange={setSurface}
    />
  );
}
