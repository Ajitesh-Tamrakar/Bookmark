import * as React from 'react';
import { PendingTable } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

const ROWS = [
  { id: 1, title: 'Designing calm interfaces', url: 'https://example.com/calm-ui', capture_method: 'web', savedAgo: '2m ago' },
  { id: 2, title: 'Deep work, revisited', url: 'https://example.com/deep-work', capture_method: 'audio', savedAgo: '18m ago' },
  { id: 3, title: 'A talk on semantic search', url: 'https://youtube.com/watch?v=xyz', capture_method: 'youtube', savedAgo: '41m ago' },
];

export function WithRows() {
  return (
    <Canvas>
      <PendingTable rows={ROWS} count={ROWS.length} />
    </Canvas>
  );
}

export function Empty() {
  return (
    <Canvas>
      <PendingTable rows={[]} count={0} />
    </Canvas>
  );
}
