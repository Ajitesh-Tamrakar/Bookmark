import SqlHint from './SqlHint';

const STAGES = ['extraction', 'chunking', 'tagging', 'embedding'];
const GRID = 'grid-cols-[1fr_84px_178px_80px_54px]';

export default function InFlightTable({ rows, count }) {
  return (
    <section id="inflight" className="scroll-mt-14">
      <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-text-faint">
        In-flight
        <span className="text-[#46444d]"> · {count}</span>
      </div>
      <h2 className="text-[21px] font-semibold tracking-tight text-text-primary mt-[7px] mb-0">
        Processing now
      </h2>
      <p className="text-text-muted text-[13.5px] leading-relaxed mt-[6px]">
        Rows a worker has claimed, with the stage they&apos;re currently in and time since the
        worker started — not time since saved.
      </p>
      <SqlHint>
        {`SELECT id, title, url, platform, current_step, processing_started_at, retry_count
FROM bookmarks WHERE processing_status = 'processing' ORDER BY processing_started_at ASC;`}
      </SqlHint>

      <div className="border border-[#1f1e24] bg-[#0a090c] rounded-xl overflow-hidden">
        <div className={`grid ${GRID} items-center gap-[14px] px-4 py-[9px] border-b border-[#1f1e24] bg-[#0c0b0e]`}>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint">bookmark</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint">platform</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint">current_step</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint text-right">elapsed</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint text-right">retries</div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-7 text-center font-mono text-[12.5px] text-[#46444d]">
            no rows processing
          </div>
        ) : (
          rows.map((r) => {
            const curIdx = STAGES.indexOf(r.current_step);
            return (
              <div
                key={r.id}
                className={`grid ${GRID} items-center gap-[14px] px-4 py-[13px] border-b border-[#141318] last:border-b-0`}
              >
                {/* title + url */}
                <div className="min-w-0 flex flex-col gap-[3px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-text-primary truncate">{r.title}</span>
                    {r.stale && (
                      <span className="shrink-0 font-mono text-[10px] tracking-[0.05em] px-[7px] py-[2px] rounded-[5px] border text-accent-warning-text border-accent-warning/35 bg-accent-warning/6">
                        stale
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11.5px] text-text-faint truncate">{r.url}</div>
                </div>

                {/* platform */}
                <div className="font-mono text-[11.5px] text-text-muted">{r.platform}</div>

                {/* stage progress */}
                <div className="flex flex-col gap-[6px]">
                  <div className="flex gap-1 items-center">
                    {STAGES.map((_, i) => (
                      <span
                        key={i}
                        className={[
                          'h-1 flex-1 rounded-sm transition-colors',
                          i < curIdx ? 'bg-[#45434c]' : i === curIdx ? 'bg-text-primary' : 'bg-[#1e1d23]',
                        ].join(' ')}
                      />
                    ))}
                  </div>
                  <div className="font-mono text-[11px] text-text-muted">
                    {r.current_step ?? '—'} · {curIdx >= 0 ? `${curIdx + 1}/4` : '—'}
                  </div>
                </div>

                {/* elapsed */}
                <div className={[
                  'font-mono text-[12.5px] tabular-nums text-right',
                  r.stale ? 'text-accent-warning-text' : 'text-[#cfcdd6]',
                ].join(' ')}>
                  {r.elapsed}
                </div>

                {/* retries */}
                <div className="font-mono text-[12px] text-text-faint text-right tabular-nums">
                  {r.retry_count > 0 ? `×${r.retry_count}` : '—'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
