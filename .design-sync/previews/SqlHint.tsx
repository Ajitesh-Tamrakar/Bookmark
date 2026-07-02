import * as React from 'react';
import { SqlHint } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

export function Basic() {
  return (
    <Canvas>
      <SqlHint>{`SELECT id, title, url, capture_method, saved_at
FROM bookmarks WHERE processing_status = 'pending' ORDER BY saved_at ASC;`}</SqlHint>
    </Canvas>
  );
}
