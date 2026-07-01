import SectionHeader from '../primitives/SectionHeader';
import Table from '../primitives/Table';
import SqlHint from './SqlHint';

const GRID = '1fr 130px 96px';

export default function PendingTable({ rows, count }) {
  return (
    <section id="pending" className="scroll-mt-14">
      <SectionHeader
        eyebrow="Pending"
        count={count}
        title="Queue"
        description="Saved, awaiting a free worker. Drains FIFO by saved_at."
      />
      <SqlHint>
        {`SELECT id, title, url, capture_method, saved_at
FROM bookmarks WHERE processing_status = 'pending' ORDER BY saved_at ASC;`}
      </SqlHint>

      <Table>
        <Table.Head columns={GRID}>
          <Table.HeadCell>bookmark</Table.HeadCell>
          <Table.HeadCell>capture_method</Table.HeadCell>
          <Table.HeadCell align="right">saved_at</Table.HeadCell>
        </Table.Head>

        {rows.length === 0 ? (
          <Table.EmptyRow>queue empty</Table.EmptyRow>
        ) : (
          rows.map((r) => (
            <Table.Row key={r.id} columns={GRID}>
              <div className="min-w-0 flex flex-col gap-[3px]">
                <div className="text-[13px] text-text-primary truncate">{r.title}</div>
                <div className="font-mono text-[11.5px] text-text-faint truncate">{r.url}</div>
              </div>
              <div className="font-mono text-[11.5px] text-text-muted">{r.capture_method}</div>
              <div className="font-mono text-[11.5px] text-text-faint text-right">{r.savedAgo}</div>
            </Table.Row>
          ))
        )}
      </Table>
    </section>
  );
}
