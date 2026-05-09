import { useState } from 'react';
import BuilderSurface from './builder/BuilderSurface';
import RunnerSurface from './runner/RunnerSurface';
import { bugReportTemplate } from './builder/templates';
import type { FormSchema } from './builder/types';

export default function App() {
  const [schema, setSchema] = useState<FormSchema>(bugReportTemplate);
  const [surface, setSurface] = useState<'builder' | 'runner'>('builder');

  if (surface === 'runner') {
    return <RunnerSurface schema={schema} onBack={() => setSurface('builder')} />;
  }

  return (
    <BuilderSurface
      schema={schema}
      onSchemaChange={setSchema}
      onPreview={() => setSurface('runner')}
    />
  );
}
