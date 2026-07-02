import * as React from 'react';
import { StatusIcon } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

export function States() {
  return (
    <Canvas>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <StatusIcon status="ok" />
        <StatusIcon status="error" />
        <StatusIcon status="running" />
        <StatusIcon status="pending" />
      </div>
    </Canvas>
  );
}
