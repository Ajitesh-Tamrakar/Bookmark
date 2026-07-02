import * as React from 'react';
import { AdvancedDevMode } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24, width: 460 }}>{children}</div>;
}

export function Collapsed() {
  return (
    <Canvas>
      <AdvancedDevMode devMode={false} onToggleDev={() => {}} advancedOpen={false} onToggleAdvanced={() => {}} />
    </Canvas>
  );
}

export function Expanded() {
  return (
    <Canvas>
      <AdvancedDevMode devMode onToggleDev={() => {}} advancedOpen onToggleAdvanced={() => {}} />
    </Canvas>
  );
}
