import * as React from 'react';
import { DeleteConfirmModal } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', minHeight: 320 }}>{children}</div>;
}

export function Open() {
  return (
    <Canvas>
      <DeleteConfirmModal open title="Designing calm interfaces" onCancel={() => {}} onConfirm={() => {}} />
    </Canvas>
  );
}
