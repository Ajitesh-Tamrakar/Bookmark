import * as React from 'react';
import { SearchInput } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24, width: 560 }}>{children}</div>;
}

export function Idle() {
  return (
    <Canvas>
      <SearchInput value="" onChange={() => {}} onClear={() => {}} loading={false} showClear={false} />
    </Canvas>
  );
}

export function WithQuery() {
  return (
    <Canvas>
      <SearchInput value="calm interfaces" onChange={() => {}} onClear={() => {}} loading={false} showClear />
    </Canvas>
  );
}

export function Loading() {
  return (
    <Canvas>
      <SearchInput value="deep work" onChange={() => {}} onClear={() => {}} loading showClear={false} />
    </Canvas>
  );
}
