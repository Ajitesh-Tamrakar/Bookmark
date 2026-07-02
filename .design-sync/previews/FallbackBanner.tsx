import * as React from 'react';
import { FallbackBanner } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24, width: 560 }}>{children}</div>;
}

export function WithSuggestions() {
  return (
    <Canvas>
      <FallbackBanner suggestedTags={['design', 'ai', 'reading-list']} onPickTag={() => {}} />
    </Canvas>
  );
}
