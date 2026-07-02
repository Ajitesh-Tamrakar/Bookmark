import * as React from 'react';
import { SegmentedControl } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

const SIMPLE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'audio', label: 'Audio' },
  { value: 'web', label: 'Web' },
];

const CARD_OPTIONS = [
  { value: 'auto', label: 'Auto', sub: 'Detect capture method' },
  { value: 'manual', label: 'Manual', sub: 'Pick a method yourself' },
];

export function Simple() {
  return (
    <Canvas>
      <SegmentedControl options={SIMPLE_OPTIONS} value="audio" onChange={() => {}} />
    </Canvas>
  );
}

export function Card() {
  return (
    <Canvas>
      <SegmentedControl options={CARD_OPTIONS} value="auto" onChange={() => {}} columns={2} variant="card" />
    </Canvas>
  );
}
