import * as React from 'react';
import { ResultsHeader } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

export function Basic() {
  return (
    <Canvas>
      <ResultsHeader label="24 results" sub="sorted by relevance" />
    </Canvas>
  );
}
