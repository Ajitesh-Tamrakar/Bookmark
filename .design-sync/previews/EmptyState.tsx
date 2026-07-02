import * as React from 'react';
import { EmptyState } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24, width: 560 }}>{children}</div>;
}

export function EmptyLibrary() {
  return (
    <Canvas>
      <EmptyState variant="empty-library" onClearAll={() => {}} onPickTag={() => {}} />
    </Canvas>
  );
}

export function NoMatch() {
  return (
    <Canvas>
      <EmptyState variant="no-match" suggestedTags={['design', 'ai']} onClearAll={() => {}} onPickTag={() => {}} />
    </Canvas>
  );
}

export function EmptyBrowse() {
  return (
    <Canvas>
      <EmptyState variant="empty-browse" tagPhrase="design, ai" onClearAll={() => {}} onPickTag={() => {}} />
    </Canvas>
  );
}
