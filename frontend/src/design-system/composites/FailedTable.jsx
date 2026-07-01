import SectionHeader from '../primitives/SectionHeader';
import Table from '../primitives/Table';
import Badge from '../primitives/Badge';
import Button from '../primitives/Button';
import SqlHint from './SqlHint';

const GRID = '1fr 104px 1.5fr 56px 92px';

export default function FailedTable({ rows, count, onRetry }) {
  return (
    <section id="failed" className="scroll-mt-14">
      <SectionHeader
        eyebrow="Failed"
        count={count}
        title="Failures"
        description="Died after the 3rd retry. The retry button re-queues the row — resets retry_count, clears failed_at, processing_error and current_step."
      />
      <SqlHint>
        {`SELECT id, title, url, failed_at, processing_error, retry_count
FROM bookmarks WHERE processing_status = 'failed' ORDER BY saved_at DESC;`}
      </SqlHint>

      <Table>
        <Table.Head columns={GRID}>
          <Table.HeadCell>bookmark</Table.HeadCell>
          <Table.HeadCell>failed_at</Table.HeadCell>
          <Table.HeadCell>processing_error</Table.HeadCell>
          <Table.HeadCell align="right">retries</Table.HeadCell>
          <Table.HeadCell align="right">action</Table.HeadCell>
        </Table.Head>

        {rows.length === 0 ? (
          <Table.EmptyRow>no failures</Table.EmptyRow>
        ) : (
          rows.map((r) => (
            <Table.Row key={r.id} columns={GRID}>
              <div className="min-w-0 flex flex-col gap-[3px]">
                <div className="text-[13px] text-text-primary truncate">{r.title}</div>
                <div className="font-mono text-[11.5px] text-text-faint truncate">{r.url}</div>
              </div>

              <div>
                <Badge tone="error" size="xs">{r.failed_at}</Badge>
              </div>

              <div className="font-mono text-[11.5px] text-text-error-muted truncate" title={r.processing_error}>
                {r.processing_error}
              </div>

              <div className="font-mono text-[12px] text-text-faint text-right tabular-nums">
                {r.retry_count > 0 ? `×${r.retry_count}` : '—'}
              </div>

              <div className="text-right">
                <Button variant="ghost" size="sm" mono onClick={() => onRetry(r.id)}>
                  ↻ retry
                </Button>
              </div>
            </Table.Row>
          ))
        )}
      </Table>
    </section>
  );
}
