import * as React from 'react';
import { ApiKeysSection } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24, width: 420 }}>{children}</div>;
}

export function Basic() {
  return (
    <Canvas>
      <ApiKeysSection
        neededProviders={['openai', 'anthropic']}
        keys={{ openai: 'sk-abc123', anthropic: '' }}
        showKey={{ openai: false, anthropic: false }}
        onSetKey={() => {}}
        onToggleShowKey={() => {}}
      />
    </Canvas>
  );
}
