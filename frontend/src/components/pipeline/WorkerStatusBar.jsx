export default function WorkerStatusBar({
  polling,
  lastRefreshText,
  concurrency,
  pollIntervalSec,
  onRefresh,
  onTogglePolling,
}) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap border border-[#1f1e24] bg-[#0c0b0e] rounded-xl px-[18px] py-[14px]">
      <div className="flex items-center gap-5 flex-wrap">
        <div className="flex items-center gap-[10px]">
          <span
            className={[
              'w-[7px] h-[7px] rounded-full shrink-0',
              polling ? 'bg-accent-success animate-pulse' : 'bg-text-faint',
            ].join(' ')}
          />
          <span className="text-[13px] font-medium text-text-primary">
            {polling ? 'Worker running' : 'Polling paused'}
          </span>
        </div>
        <span className="font-mono text-[11.5px] text-text-faint">
          concurrency {concurrency} / {concurrency}
        </span>
        <span className="font-mono text-[11.5px] text-text-faint">
          poll every {pollIntervalSec}s
        </span>
      </div>

      <div className="flex items-center gap-[18px] flex-wrap justify-end">
        <span className="font-mono text-[11.5px] text-text-faint">
          refreshed {lastRefreshText}
        </span>

        <button
          type="button"
          onClick={onRefresh}
          className="border border-border-default text-text-secondary font-mono text-[12px] px-3 py-[7px] rounded-[7px] bg-transparent cursor-pointer hover:border-border-strong hover:text-text-primary transition-colors"
        >
          ↻ refresh
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11.5px] text-text-faint">polling</span>
          <button
            type="button"
            onClick={onTogglePolling}
            aria-label="Toggle polling"
            className={[
              'relative w-9 h-[21px] rounded-full cursor-pointer border transition-all p-0',
              polling
                ? 'bg-text-primary border-border-strong'
                : 'bg-bg-sunken border-[#2a2930]',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-[2px] w-[15px] h-[15px] rounded-full transition-all',
                polling ? 'left-[17px] bg-bg-base' : 'left-[2px] bg-[#6b6973]',
              ].join(' ')}
            />
          </button>
        </div>

      </div>
    </div>
  );
}
