import * as React from 'react';
import { PipelineNav } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

const ITEMS = [
  { id: 'pending', label: 'Pending' },
  { id: 'inflight', label: 'In-flight' },
  { id: 'failed', label: 'Failed' },
  { id: 'temp', label: 'Temp folder' },
  { id: 'summary', label: 'Summary' },
];

export function Basic() {
  return (
    <Canvas>
      <PipelineNav items={ITEMS} activeSection="inflight" />
    </Canvas>
  );
}
