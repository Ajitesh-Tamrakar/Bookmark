import * as React from 'react';
import { Card } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

export function Variants() {
  return (
    <Canvas>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card variant="panel">
          <div style={{ fontSize: 13, color: '#ededee' }}>Panel card — default surface for grouped content.</div>
        </Card>
        <Card variant="sunken">
          <div style={{ fontSize: 13, color: '#c9c7d0' }}>Sunken card — recessed, for nested content.</div>
        </Card>
        <Card variant="raised">
          <div style={{ padding: 16, fontSize: 13, color: '#c9c7d0' }}>Raised card — elevated surface.</div>
        </Card>
      </div>
    </Canvas>
  );
}
