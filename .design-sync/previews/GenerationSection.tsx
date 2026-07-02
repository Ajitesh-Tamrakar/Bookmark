import * as React from 'react';
import { GenerationSection } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24, width: 460 }}>{children}</div>;
}

export function Collapsed() {
  return (
    <Canvas>
      <GenerationSection
        expanded={false}
        genProvider="ollama"
        genModel="qwen2.5:7b"
        onGenProvider={() => {}}
        onGenModel={() => {}}
        onCustomize={() => {}}
      />
    </Canvas>
  );
}

export function Expanded() {
  return (
    <Canvas>
      <GenerationSection
        expanded
        genProvider="anthropic"
        genModel="claude-sonnet-4"
        onGenProvider={() => {}}
        onGenModel={() => {}}
        onCustomize={() => {}}
      />
    </Canvas>
  );
}
