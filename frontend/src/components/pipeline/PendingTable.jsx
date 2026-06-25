import SqlHint from './SqlHint';

const GRID = 'grid-cols-[1fr_130px_96px]';

export default function PendingTable({ rows, count }) {
  return (
    <section id="pending" className="scroll-mt-14">
      <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-text-faint">
        Pending
        <span className="text-[#46444d]"> · {count}</span>
      </div>
      <h2 className="text-[21px] font-semibold tracking-tight text-text-primary mt-[7px] mb-0">
        Queue
      </h2>
      <p className="text-text-muted text-[13.5px] leading-relaxed mt-[6px]">
        Saved, awaiting a free worker. Drains FIFO by saved_at.
      </p>
      <SqlHint>
        {`SELECT id, title, url, capture_method, saved_at
FROM bookmarks WHERE processing_status = 'pending' ORDER BY saved_at ASC;`}
      </SqlHint>

      <div className="border border-[#1f1e24] bg-[#0a090c] rounded-xl overflow-hidden">
        <div className={`grid ${GRID} items-center gap-[14px] px-4 py-[9px] border-b border-[#1f1e24] bg-[#0c0b0e]`}>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint">bookmark</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint">capture_method</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint text-right">saved_at</div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-7 text-center font-mono text-[12.5px] text-[#46444d]">
            queue empty
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
              <div className="font-mono text-[11.5px] text-text-muted">{r.capture_method}</div>
              <div className="font-mono text-[11.5px] text-text-faint text-right">{r.savedAgo}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
