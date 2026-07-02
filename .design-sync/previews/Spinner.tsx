import * as React from 'react';
import { Spinner } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

export function Sizes() {
  return (
    <Canvas>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Spinner size={12} />
        <Spinner size={16} />
        <Spinner size={24} />
      </div>
    </Canvas>
  );
}
