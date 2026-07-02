import * as React from 'react';
import { Table } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24 }}>{children}</div>;
}

const GRID = '1fr 130px 96px';

export function WithRows() {
  return (
    <Canvas>
      <Table>
        <Table.Head columns={GRID}>
          <Table.HeadCell>bookmark</Table.HeadCell>
          <Table.HeadCell>capture_method</Table.HeadCell>
          <Table.HeadCell align="right">saved_at</Table.HeadCell>
        </Table.Head>
        <Table.Row columns={GRID}>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 13, color: '#ededee' }}>Designing calm interfaces</div>
            <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#66646e' }}>https://example.com/calm-ui</div>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#9a98a3' }}>web</div>
          <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#66646e', textAlign: 'right' }}>2m ago</div>
        </Table.Row>
        <Table.Row columns={GRID}>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 13, color: '#ededee' }}>Deep work, revisited</div>
            <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#66646e' }}>https://example.com/deep-work</div>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#9a98a3' }}>audio</div>
          <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#66646e', textAlign: 'right' }}>18m ago</div>
        </Table.Row>
      </Table>
    </Canvas>
  );
}

export function EmptyState() {
  return (
    <Canvas>
      <Table>
        <Table.Head columns={GRID}>
          <Table.HeadCell>bookmark</Table.HeadCell>
          <Table.HeadCell>capture_method</Table.HeadCell>
          <Table.HeadCell align="right">saved_at</Table.HeadCell>
        </Table.Head>
        <Table.EmptyRow>queue empty</Table.EmptyRow>
      </Table>
    </Canvas>
  );
}
