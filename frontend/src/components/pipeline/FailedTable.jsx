import SqlHint from './SqlHint';

const GRID = 'grid-cols-[1fr_104px_1.5fr_56px_92px]';

export default function FailedTable({ rows, count, onRetry }) {
  return (
    <section id="failed" className="scroll-mt-14">
      <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-text-faint">
        Failed
        <span className="text-[#46444d]"> · {count}</span>
      </div>
      <h2 className="text-[21px] font-semibold tracking-tight text-text-primary mt-[7px] mb-0">
        Failures
      </h2>
      <p className="text-text-muted text-[13.5px] leading-relaxed mt-[6px]">
        Died after the 3rd retry. The retry button re-queues the row — resets retry_count, clears
        failed_at, processing_error and current_step.
      </p>
      <SqlHint>
        {`SELECT id, title, url, failed_at, processing_error, retry_count
FROM bookmarks WHERE processing_status = 'failed' ORDER BY saved_at DESC;`}
      </SqlHint>

      <div className="border border-[#1f1e24] bg-[#0a090c] rounded-xl overflow-hidden">
        <div className={`grid ${GRID} items-center gap-[14px] px-4 py-[9px] border-b border-[#1f1e24] bg-[#0c0b0e]`}>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint">bookmark</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint">failed_at</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint">processing_error</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint text-right">retries</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint text-right">action</div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-7 text-center font-mono text-[12.5px] text-[#46444d]">
            no failures
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className={`grid ${GRID} items-center gap-[14px] px-4 py-[13px] border-b border-[#141318] last:border-b-0`}
            >
              <div className="min-w-0 flex flex-col gap-[3px]">
                <div className="text-[13px] text-text-primary truncate">{r.title}</div>
                <div className="font-mono text-[11.5px] text-text-faint truncate">{r.url}</div>
              </div>

              <div>
                <span className="font-mono text-[10px] tracking-[0.05em] px-[7px] py-[2px] rounded-[5px] border text-accent-error border-accent-error/30 bg-accent-error/7">
                  {r.failed_at}
                </span>
              </div>

              <div
                className="font-mono text-[11.5px] text-[#b5736e] truncate"
                title={r.processing_error}
              >
                {r.processing_error}
              </div>

              <div className="font-mono text-[12px] text-text-faint text-right tabular-nums">
                {r.retry_count > 0 ? `×${r.retry_count}` : '—'}
              </div>

              <div className="text-right">
                {/* TODO(backend): replace with real retry endpoint call */}
                <button
                  type="button"
                  onClick={() => onRetry(r.id)}
                  className="border border-border-default text-text-secondary text-[11.5px] px-[11px] py-[6px] rounded-[7px] bg-transparent cursor-pointer hover:border-border-strong hover:text-text-primary transition-colors"
                >
                  ↻ retry
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
