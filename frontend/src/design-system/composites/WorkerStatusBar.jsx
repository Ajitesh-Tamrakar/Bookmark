import Card from '../primitives/Card';
import Button from '../primitives/Button';
import Switch from '../primitives/Switch';

export default function WorkerStatusBar({
  polling,
  lastRefreshText,
  concurrency,
  pollIntervalSec,
  onRefresh,
  onTogglePolling,
}) {
  return (
    <Card variant="panel" className="flex items-center justify-between gap-4 flex-wrap">
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

        <Button variant="ghost" size="sm" mono onClick={onRefresh}>
          ↻ refresh
        </Button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11.5px] text-text-faint">polling</span>
          <Switch checked={polling} onChange={onTogglePolling} />
        </div>
      </div>
    </Card>
  );
}
