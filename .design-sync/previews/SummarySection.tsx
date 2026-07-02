import * as React from 'react';
import { SummarySection } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

const SUMMARY = [
  { label: 'pending', value: 12, dotKey: 'p' },
  { label: 'processing', value: 3, dotKey: 'pr' },
  { label: 'completed', value: 482, dotKey: 'c' },
  { label: 'failed', value: 2, dotKey: 'f', isError: true },
];

export function Basic() {
  return (
    <Canvas>
      <SummarySection summary={SUMMARY} />
    </Canvas>
  );
}
