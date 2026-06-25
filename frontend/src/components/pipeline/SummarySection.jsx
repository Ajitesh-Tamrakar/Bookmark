import SqlHint from './SqlHint';

const DOT_CLASSES = {
  p: 'bg-text-faint',
  pr: 'bg-text-primary',
  c: 'bg-accent-success',
  f: 'bg-accent-error',
};

export default function SummarySection({ summary }) {
  return (
    <section id="summary" className="scroll-mt-14">
      <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-text-faint">
        Summary
      </div>
      <h2 className="text-[21px] font-semibold tracking-tight text-text-primary mt-[7px] mb-0">
        Status counts
      </h2>
      <SqlHint>
        {`SELECT processing_status, COUNT(*) FROM bookmarks GROUP BY processing_status;`}
      </SqlHint>
      <div className="flex gap-3">
        {summary.map((s) => (
          <div
            key={s.label}
            className="flex-1 border border-[#1f1e24] bg-[#0c0b0e] rounded-xl px-[18px] py-4"
          >
            <div
              className={[
                'text-[30px] font-semibold tracking-[-0.02em] leading-none tabular-nums',
                s.isError ? 'text-accent-error' : 'text-text-primary',
              ].join(' ')}
            >
              {s.value}
            </div>
            <div className="flex items-center gap-2 mt-[11px]">
              <span
                className={[
                  'w-[7px] h-[7px] rounded-full shrink-0',
                  DOT_CLASSES[s.dotKey],
                ].join(' ')}
              />
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-text-faint">
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
