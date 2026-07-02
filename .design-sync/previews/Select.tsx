import * as React from 'react';
import { Select } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'local', label: 'Local' },
];

export function Basic() {
  return (
    <Canvas>
      <div style={{ width: 220 }}>
        <Select label="Provider" options={PROVIDER_OPTIONS} defaultValue="anthropic" />
      </div>
    </Canvas>
  );
}
