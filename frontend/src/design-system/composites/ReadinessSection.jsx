import Card from '../primitives/Card';
import StatusIcon from '../primitives/StatusIcon';
import ProgressBar from '../primitives/ProgressBar';
import Callout from '../primitives/Callout';
import Button from '../primitives/Button';
import Spinner from '../primitives/Spinner';

export default function ReadinessSection({ checkRows, checkState, onRunCheck }) {
  const hasError = checkRows.some((r) => r.status === 'error');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[6px]">
        {checkRows.length === 0 && checkState === 'idle' && (
          <p className="text-[13px] text-text-faint">Run the check to verify your setup.</p>
        )}
        {checkRows.map((row) => (
          <div key={row.id} className="flex flex-col gap-1">
            <Card variant="sunken" className="flex items-center gap-3">
              <StatusIcon status={row.status} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-primary truncate">{row.label}</p>
                {row.kind === 'model' && row.size && (
                  <p className="text-[11px] text-text-faint mt-[1px]">
                    {`~${row.size >= 1000 ? (row.size / 1000).toFixed(1) + ' GB' : row.size + ' MB'}`}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-text-faint capitalize shrink-0">{row.status}</span>
            </Card>
            {row.status === 'progress' && typeof row.loaded === 'number' && row.size > 0 && (
              <ProgressBar
                percent={(row.loaded / row.size) * 100}
                track="subtle"
                fill="success"
                height={3}
                className="mx-4"
              />
            )}
          </div>
        ))}
      </div>

      {hasError && (
        <Callout tone="error" title="Ollama isn't running">
          <p className="mb-3">
            Start Ollama with{' '}
            <code className="font-mono text-[12px] bg-border-subtle/40 px-1 py-0.5 rounded">ollama serve</code> and
            try again.
          </p>
          <Button variant="ghost-danger" size="sm" onClick={onRunCheck}>
            Retry
          </Button>
        </Callout>
      )}

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="md" onClick={onRunCheck} disabled={checkState === 'running'}>
          {checkState === 'running' ? <Spinner size={16} /> : <span>↻</span>}
          {checkState === 'running' ? 'Checking…' : 're-run'}
        </Button>
      </div>
    </div>
  );
}
