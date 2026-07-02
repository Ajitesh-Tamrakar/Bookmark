import * as React from 'react';
import { Badge } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

export function Tones() {
  return (
    <Canvas>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Badge tone="neutral">neutral</Badge>
        <Badge tone="muted">muted</Badge>
        <Badge tone="error">error</Badge>
        <Badge tone="warning">warning</Badge>
        <Badge tone="info">info</Badge>
        <Badge tone="success">success</Badge>
      </div>
    </Canvas>
  );
}

export function SourceTones() {
  return (
    <Canvas>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Badge tone="audio">audio</Badge>
        <Badge tone="tagAi">tag: ai</Badge>
        <Badge tone="youtube">youtube</Badge>
        <Badge tone="linkedin">linkedin</Badge>
        <Badge tone="pinterest">pinterest</Badge>
        <Badge tone="web">web</Badge>
      </div>
    </Canvas>
  );
}

export function SizesAndDot() {
  return (
    <Canvas>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Badge tone="success" size="pill" dot>live</Badge>
        <Badge tone="warning" size="tag" dot>pending</Badge>
        <Badge tone="neutral" size="chip">42</Badge>
        <Badge tone="locked" size="xxs">locked</Badge>
      </div>
    </Canvas>
  );
}
