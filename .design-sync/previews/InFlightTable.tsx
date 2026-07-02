import * as React from 'react';
import { InFlightTable } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

const ROWS = [
  { id: 1, title: 'Designing calm interfaces', url: 'https://example.com/calm-ui', platform: 'web', current_step: 'embedding', elapsed: '12s', retry_count: 0, stale: false },
  { id: 2, title: 'A long transcription job', url: 'https://example.com/podcast-ep', platform: 'audio', current_step: 'chunking', elapsed: '4m 02s', retry_count: 1, stale: true },
];

export function WithRows() {
  return (
    <Canvas>
      <InFlightTable rows={ROWS} count={ROWS.length} />
    </Canvas>
  );
}

export function Empty() {
  return (
    <Canvas>
      <InFlightTable rows={[]} count={0} />
    </Canvas>
  );
}
