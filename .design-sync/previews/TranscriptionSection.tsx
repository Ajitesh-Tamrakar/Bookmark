import * as React from 'react';
import { TranscriptionSection } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24, width: 420 }}>{children}</div>;
}

export function Basic() {
  return (
    <Canvas>
      <TranscriptionSection whisper="base" onSetWhisper={() => {}} />
    </Canvas>
  );
}
