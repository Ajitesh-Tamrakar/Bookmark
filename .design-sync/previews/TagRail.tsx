import * as React from 'react';
import { TagRail } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24, width: 640 }}>{children}</div>;
}

const TAGS = [
  { name: 'design', count: 24 },
  { name: 'ai', count: 18 },
  { name: 'productivity', count: 11 },
  { name: 'reading-list', count: 7 },
  { name: 'video', count: 5 },
];

export function Unselected() {
  return (
    <Canvas>
      <TagRail tags={TAGS} selectedTags={[]} onToggleTag={() => {}} onClearAll={() => {}} />
    </Canvas>
  );
}

export function WithSelection() {
  return (
    <Canvas>
      <TagRail tags={TAGS} selectedTags={['design', 'ai']} onToggleTag={() => {}} onClearAll={() => {}} />
    </Canvas>
  );
}
