import * as React from 'react';
import { Input } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

export function Basic() {
  return (
    <Canvas>
      <div style={{ width: 280 }}>
        <Input label="API key" placeholder="sk-..." defaultValue="" />
      </div>
    </Canvas>
  );
}

export function WithTrailing() {
  return (
    <Canvas>
      <div style={{ width: 280 }}>
        <Input
          label="Search"
          defaultValue="capture status"
          trailing={<span style={{ fontSize: 11, color: '#66646e' }}>⌘K</span>}
        />
      </div>
    </Canvas>
  );
}
