import SqlHint from './SqlHint';

const GRID = 'grid-cols-[1fr_84px_80px_54px]';

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
        Rows a worker has claimed. Elapsed time is measured from saved_at.
      </p>
      <SqlHint>
        {`SELECT id, title, url, platform, retry_count, saved_at
FROM bookmarks WHERE processing_status = 'processing' ORDER BY saved_at ASC;`}
      </SqlHint>

      <div className="border border-[#1f1e24] bg-[#0a090c] rounded-xl overflow-hidden">
        <div className={`grid ${GRID} items-center gap-[14px] px-4 py-[9px] border-b border-[#1f1e24] bg-[#0c0b0e]`}>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint">bookmark</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint">platform</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint text-right">elapsed</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint text-right">retries</div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-7 text-center font-mono text-[12.5px] text-[#46444d]">
            no rows processing
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className={`grid ${GRID} items-center gap-[14px] px-4 py-[13px] border-b border-[#141318] last:border-b-0`}
            >
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

              <div className="font-mono text-[11.5px] text-text-muted">{r.platform}</div>

              <div className={[
                'font-mono text-[12.5px] tabular-nums text-right',
                r.stale ? 'text-accent-warning-text' : 'text-[#cfcdd6]',
              ].join(' ')}>
                {r.elapsed}
              </div>

              <div className="font-mono text-[12px] text-text-faint text-right tabular-nums">
                {r.retry_count > 0 ? `×${r.retry_count}` : '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
