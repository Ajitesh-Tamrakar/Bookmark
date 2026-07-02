import * as React from 'react';
import { ResultCard } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>;
}

const now = Date.now();

export function WithScore() {
  return (
    <Canvas>
      <ResultCard
        item={{
          id: 1,
          title: 'Designing calm, low-noise interfaces',
          url: 'https://example.com/articles/calm-ui',
          author: 'Jane Doe',
          platform: 'web',
          saved_at: new Date(now - 2 * 3600 * 1000).toISOString(),
          distance: 0.18,
          tags: [{ name: 'design', source: 'user' }, { name: 'ui', source: 'ai' }],
        }}
        showScore
        onDelete={() => {}}
        onPickTag={() => {}}
      />
    </Canvas>
  );
}

export function YoutubeWithTimestamp() {
  return (
    <Canvas>
      <ResultCard
        item={{
          id: 2,
          title: 'Deep work, revisited — a 2024 talk',
          url: 'https://youtube.com/watch?v=abc123',
          author: 'Some Channel',
          platform: 'youtube',
          saved_at: new Date(now - 18 * 60 * 1000).toISOString(),
          distance: 0.42,
          timestamp_seconds: 754,
          tags: [{ name: 'productivity', source: 'ai' }],
        }}
        showScore
        onDelete={() => {}}
        onPickTag={() => {}}
      />
    </Canvas>
  );
}

export function WithoutScore() {
  return (
    <Canvas>
      <ResultCard
        item={{
          id: 3,
          title: 'A pinned recipe for weeknight dinners',
          url: 'https://pinterest.com/pin/998877',
          platform: 'pinterest',
          saved_at: new Date(now - 3 * 24 * 3600 * 1000).toISOString(),
          tags: [],
        }}
        showScore={false}
        onDelete={() => {}}
        onPickTag={() => {}}
      />
    </Canvas>
  );
}
