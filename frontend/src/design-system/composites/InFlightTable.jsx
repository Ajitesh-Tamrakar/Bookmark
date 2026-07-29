import SectionHeader from '../primitives/SectionHeader';
import Table from '../primitives/Table';
import Badge from '../primitives/Badge';
import SqlHint from './SqlHint';

const STAGES = ['extraction', 'chunking', 'tagging', 'embedding'];
const GRID = '1fr 84px 178px 80px 54px';

export default function InFlightTable({ rows, count }) {
  return (
    <section id="inflight" className="scroll-mt-14">
      <SectionHeader
        eyebrow="In-flight"
        count={count}
        title="Processing now"
        description="Rows a worker has claimed, with the stage they're currently in and time since the worker started — not time since saved."
      />
      <SqlHint>
        {`SELECT id, title, url, platform, current_step, processing_started_at, retry_count
FROM bookmarks WHERE processing_status = 'processing' ORDER BY processing_started_at ASC;`}
      </SqlHint>

      <Table>
        <Table.Head columns={GRID}>
          <Table.HeadCell>bookmark</Table.HeadCell>
          <Table.HeadCell>platform</Table.HeadCell>
          <Table.HeadCell>current_step</Table.HeadCell>
          <Table.HeadCell align="right">elapsed</Table.HeadCell>
          <Table.HeadCell align="right">retries</Table.HeadCell>
        </Table.Head>

        {rows.length === 0 ? (
          <Table.EmptyRow>no rows processing</Table.EmptyRow>
        ) : (
          rows.map((r) => {
            const curIdx = STAGES.indexOf(r.current_step);
            return (
              <Table.Row key={r.id} columns={GRID}>
                <div className="min-w-0 flex flex-col gap-[3px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-text-primary truncate">{r.title}</span>
                    {r.stuck ? (
                      <Badge tone="error" size="xs" className="shrink-0">stuck</Badge>
                    ) : r.stale && (
                      <Badge tone="warning" size="xs" className="shrink-0">stale</Badge>
                    )}
                  </div>
                  <div className="font-mono text-[11.5px] text-text-faint truncate">{r.url}</div>
                </div>

                <div className="font-mono text-[11.5px] text-text-muted">{r.platform}</div>

                <div className="flex flex-col gap-[6px]">
                  <div className="flex gap-1 items-center">
                    {STAGES.map((_, i) => (
                      <span
                        key={i}
                        className={[
                          'h-1 flex-1 rounded-sm transition-colors',
                          i < curIdx ? 'bg-stage-passed' : i === curIdx ? 'bg-text-primary' : 'bg-stage-pending',
                        ].join(' ')}
                      />
                    ))}
                  </div>
                  <div className="font-mono text-[11px] text-text-muted">
                    {r.current_step ?? '—'} · {curIdx >= 0 ? `${curIdx + 1}/4` : '—'}
                  </div>
                </div>

                <div
                  className={[
                    'font-mono text-[12.5px] tabular-nums text-right',
                    r.stuck ? 'text-accent-error' : r.stale ? 'text-accent-warning-text' : 'text-text-inverse-muted',
                  ].join(' ')}
                >
                  {r.elapsed}
                </div>

                <div className="font-mono text-[12px] text-text-faint text-right tabular-nums">
                  {r.retry_count > 0 ? `×${r.retry_count}` : '—'}
                </div>
              </Table.Row>
            );
          })
        )}
      </Table>
    </section>
  );
}
