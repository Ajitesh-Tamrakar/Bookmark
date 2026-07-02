import * as React from 'react';
import { ReadinessSection } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24, width: 480 }}>{children}</div>;
}

export function InProgress() {
  return (
    <Canvas>
      <ReadinessSection
        checkState="running"
        checkRows={[
          { id: 'ollama', label: 'Ollama running', status: 'ok', kind: 'service' },
          { id: 'm1', label: 'nomic-embed-text-v2-moe', status: 'progress', kind: 'model', size: 550, loaded: 320 },
          { id: 'm2', label: 'qwen2.5:7b', status: 'pending', kind: 'model', size: 4700 },
        ]}
        onRunCheck={() => {}}
      />
    </Canvas>
  );
}

export function WithError() {
  return (
    <Canvas>
      <ReadinessSection
        checkState="idle"
        checkRows={[{ id: 'ollama', label: 'Ollama running', status: 'error', kind: 'service' }]}
        onRunCheck={() => {}}
      />
    </Canvas>
  );
}
