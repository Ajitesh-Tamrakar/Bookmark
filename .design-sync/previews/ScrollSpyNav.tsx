import * as React from 'react';
import { ScrollSpyNav } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

const ITEMS = [
  { id: 'pending', label: 'Pending' },
  { id: 'in-flight', label: 'In flight' },
  { id: 'failed', label: 'Failed' },
  { id: 'summary', label: 'Summary' },
];

export function Basic() {
  return (
    <Canvas>
      <ScrollSpyNav items={ITEMS} activeSection="in-flight" label="Pipeline" />
    </Canvas>
  );
}
