import * as React from 'react';
import { Button } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

export function Variants() {
  return (
    <Canvas>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="ghost">Ghost</Button>
        <Button variant="primary">Primary</Button>
        <Button variant="danger">Delete</Button>
        <Button variant="ghost-danger">Cancel</Button>
      </div>
    </Canvas>
  );
}

export function Sizes() {
  return (
    <Canvas>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="md">Medium</Button>
        <Button variant="primary" size="lg">Large</Button>
      </div>
    </Canvas>
  );
}

export function States() {
  return (
    <Canvas>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="primary" disabled>Disabled primary</Button>
        <Button variant="ghost" disabled>Disabled ghost</Button>
        <Button variant="primary" mono>Re-run capture</Button>
        <Button variant="primary" fullWidth>Full width</Button>
      </div>
    </Canvas>
  );
}
