import * as React from 'react';
import { ProviderToggle } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

export function Basic() {
  return (
    <Canvas>
      <ProviderToggle top="ollama" onSetTop={() => {}} />
    </Canvas>
  );
}
