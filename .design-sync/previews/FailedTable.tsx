import * as React from 'react';
import { FailedTable } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

const ROWS = [
  { id: 1, title: 'A paywalled article', url: 'https://example.com/paywall', failed_at: '2h ago', processing_error: 'HTTP 403 after 3 retries', retry_count: 3 },
  { id: 2, title: 'Broken video link', url: 'https://example.com/video-404', failed_at: '5h ago', processing_error: 'source URL returned 404', retry_count: 3 },
];

export function WithRows() {
  return (
    <Canvas>
      <FailedTable rows={ROWS} count={ROWS.length} onRetry={() => {}} />
    </Canvas>
  );
}

export function Empty() {
  return (
    <Canvas>
      <FailedTable rows={[]} count={0} onRetry={() => {}} />
    </Canvas>
  );
}
