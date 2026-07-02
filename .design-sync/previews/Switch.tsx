import * as React from 'react';
import { Switch } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

export function States() {
  return (
    <Canvas>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Switch checked={true} onChange={() => {}} />
        <Switch checked={false} onChange={() => {}} />
        <Switch checked={true} onChange={() => {}} disabled />
        <Switch checked={false} onChange={() => {}} disabled />
      </div>
    </Canvas>
  );
}
