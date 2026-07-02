import * as React from 'react';
import { SectionHeader } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

export function Basic() {
  return (
    <Canvas>
      <SectionHeader
        eyebrow="Pending"
        count={12}
        title="Queue"
        description="Saved, awaiting a free worker. Drains FIFO by saved_at."
      />
    </Canvas>
  );
}

export function WithTag() {
  return (
    <Canvas>
      <SectionHeader
        eyebrow="Embedding"
        eyebrowTag="locked"
        title="Model"
        description="Locked after the first bookmark is saved — switching later requires a full re-embed."
      />
    </Canvas>
  );
}
