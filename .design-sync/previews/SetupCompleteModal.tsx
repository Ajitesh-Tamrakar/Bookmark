import * as React from 'react';
import { SetupCompleteModal } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', minHeight: 360 }}>{children}</div>;
}

export function Open() {
  return (
    <Canvas>
      <SetupCompleteModal open embedModel="nomic-embed-text-v2-moe (768d)" onCancel={() => {}} onConfirm={() => {}} />
    </Canvas>
  );
}
