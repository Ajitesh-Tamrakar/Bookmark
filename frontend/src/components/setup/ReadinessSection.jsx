function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-success shrink-0">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 8.5l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-error shrink-0">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <span
      className="animate-spin shrink-0 inline-block w-4 h-4 rounded-full border-2 border-text-faint border-t-text-secondary"
    />
  );
}

function PendingIcon() {
  return (
    <span className="shrink-0 inline-block w-[6px] h-[6px] rounded-full bg-text-faint opacity-40 mx-[5px]" />
  );
}

function StatusIcon({ status }) {
  if (status === 'ok') return <CheckIcon />;
  if (status === 'error') return <ErrorIcon />;
  if (status === 'running' || status === 'progress') return <SpinnerIcon />;
  return <PendingIcon />;
}

const hasOllamaService = (rows) => rows.some((r) => r.id === 'service');

export default function ReadinessSection({ checkRows, checkState, onRunCheck, onSimulateOffline }) {
  const showOfflineBtn = hasOllamaService(checkRows);
  const hasError = checkRows.some((r) => r.status === 'error');

  return (
    <div className="flex flex-col gap-4">
      {/* Row list */}
      <div className="flex flex-col gap-[6px]">
        {checkRows.length === 0 && checkState === 'idle' && (
          <p className="text-[13px] text-text-faint">Run the check to verify your setup.</p>
        )}
        {checkRows.map((row) => (
          <div key={row.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-3 py-[9px] px-4 rounded-[8px] border border-border-subtle bg-bg-sunken">
              <StatusIcon status={row.status} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-primary truncate">{row.label}</p>
                {row.kind === 'model' && row.size && (
                  <p className="text-[11px] text-text-faint mt-[1px]">
                    {row.kind === 'model'
                      ? `~${row.size >= 1000 ? (row.size / 1000).toFixed(1) + ' GB' : row.size + ' MB'}`
                      : ''}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-text-faint capitalize shrink-0">{row.status}</span>
            </div>
            {row.status === 'progress' && typeof row.loaded === 'number' && row.size > 0 && (
              <div className="h-[3px] rounded-full bg-border-subtle mx-4 overflow-hidden">
                <div
                  className="h-full bg-accent-success rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(100, (row.loaded / row.size) * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error callout */}
      {hasError && (
        <div className="rounded-[10px] border border-accent-error/30 bg-accent-error/[0.07] px-4 py-[12px]">
          <p className="text-[13px] font-semibold text-accent-error mb-[4px]">Ollama isn&apos;t running</p>
          <p className="text-[13px] text-text-muted mb-3">
            Start Ollama with <code className="font-mono text-[12px] bg-border-subtle/40 px-1 py-0.5 rounded">ollama serve</code> and try again.
          </p>
          <button
            type="button"
            onClick={onRunCheck}
            className="text-[12px] font-medium text-accent-error border border-accent-error/40 px-3 py-[6px] rounded-[6px] hover:bg-accent-error/10 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRunCheck}
          disabled={checkState === 'running'}
          className="flex items-center gap-2 text-[13px] font-medium text-text-secondary border border-border-default px-4 py-[8px] rounded-[8px] hover:border-border-strong transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checkState === 'running' ? (
            <SpinnerIcon />
          ) : (
            <span>↻</span>
          )}
          {checkState === 'running' ? 'Checking…' : 're-run'}
        </button>

        {showOfflineBtn && (
          <button
            type="button"
            onClick={onSimulateOffline}
            className="text-[12px] text-text-faint hover:text-text-muted transition-colors cursor-pointer"
          >
            simulate offline
          </button>
        )}
      </div>
    </div>
  );
}
