import * as React from 'react';
import { ProgressBar } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

export function Progress() {
  return (
    <Canvas>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 240 }}>
        <ProgressBar percent={30} />
        <ProgressBar percent={70} fill="success" />
        <ProgressBar percent={100} track="subtle" fill="faint" height={6} />
      </div>
    </Canvas>
  );
}
