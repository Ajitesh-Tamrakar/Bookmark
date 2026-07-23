import { fmtPct } from '../retrievalUtils';

export default function BreakdownChart({ buckets }) {
  return (
    <div className="flex items-end justify-around h-[140px]">
      {buckets.map((b) => (
        <div key={b.key} className="flex flex-col items-center gap-2 w-[130px]">
          <div className="flex items-end gap-2 h-[120px]">
            <div
              className="w-7 rounded-t"
              style={{ height: `${Math.round(b.recall1 * 120)}px`, background: 'var(--color-accent-info)' }}
            />
            <div
              className="w-7 rounded-t"
              style={{ height: `${Math.round(b.recall5 * 120)}px`, background: 'var(--color-accent-success)' }}
            />
          </div>
          <div className="font-mono text-text-muted text-[11px] mt-1">{b.label}</div>
          <div className="font-mono text-text-faint text-[10px]">
            {fmtPct(b.recall1)} · {fmtPct(b.recall5)}
          </div>
        </div>
      ))}
    </div>
  );
}
