import * as React from 'react';
import { TempFolderSection } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

const FILES = [
  { bid: 'a1b2c3', type: 'video', ext: 'mp4', size: '84.2 MB' },
  { bid: 'd4e5f6', type: 'image', ext: 'jpg', size: '412 KB' },
  { bid: 'g7h8i9', type: 'audio', ext: 'mp3', size: '9.1 MB' },
];

export function Basic() {
  return (
    <Canvas>
      <TempFolderSection files={FILES} />
    </Canvas>
  );
}
