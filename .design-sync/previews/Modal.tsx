import * as React from 'react';
import { Modal, Button } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', minHeight: 320 }}>{children}</div>;
}

export function Open() {
  return (
    <Canvas>
      <Modal open onClose={() => {}} maxWidth={420}>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#ededee', margin: 0 }}>Delete this bookmark?</p>
          <p style={{ fontSize: 13, color: '#9a98a3', marginTop: 8, lineHeight: 1.5 }}>
            This removes it from your library and cancels any in-flight processing. This can't be undone.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <Button variant="ghost">Cancel</Button>
            <Button variant="danger">Delete</Button>
          </div>
        </div>
      </Modal>
    </Canvas>
  );
}
