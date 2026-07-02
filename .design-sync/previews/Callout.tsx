import * as React from 'react';
import { Callout } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5l7 12.5H1L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 6.5v3.2M8 11.8v.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function Tones() {
  return (
    <Canvas>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Callout tone="warning" icon={<WarningIcon />} title="This action is permanent">
          Once you save your first bookmark, the embedding model is locked. Switching later means recomputing every card in re-scope.
        </Callout>
        <Callout tone="error" title="Capture failed">
          The worker couldn't reach the source URL after 3 retries.
        </Callout>
        <Callout tone="info">
          Transcription runs locally when a GPU is available, otherwise it falls back to the cloud provider.
        </Callout>
        <Callout tone="success" title="Setup complete">
          Your pipeline is ready — bookmarks will start processing automatically.
        </Callout>
      </div>
    </Canvas>
  );
}
