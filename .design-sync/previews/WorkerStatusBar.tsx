import * as React from 'react';
import { WorkerStatusBar } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

export function Running() {
  return (
    <Canvas>
      <WorkerStatusBar
        polling
        lastRefreshText="4s ago"
        concurrency={3}
        pollIntervalSec={5}
        onRefresh={() => {}}
        onTogglePolling={() => {}}
      />
    </Canvas>
  );
}

export function Paused() {
  return (
    <Canvas>
      <WorkerStatusBar
        polling={false}
        lastRefreshText="2m ago"
        concurrency={3}
        pollIntervalSec={5}
        onRefresh={() => {}}
        onTogglePolling={() => {}}
      />
    </Canvas>
  );
}
