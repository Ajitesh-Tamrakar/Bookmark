import * as React from 'react';
import { SetupNav } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

const ITEMS = [
  { id: 'provider', label: 'Provider' },
  { id: 'embedding', label: 'Embedding' },
  { id: 'generation', label: 'Generation' },
  { id: 'transcription', label: 'Transcription' },
  { id: 'readiness', label: 'Readiness' },
];

export function Basic() {
  return (
    <Canvas>
      <SetupNav items={ITEMS} activeSection="embedding" />
    </Canvas>
  );
}
