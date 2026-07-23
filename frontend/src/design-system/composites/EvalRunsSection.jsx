import { useState } from 'react';
import SectionHeader from '../primitives/SectionHeader';
import Badge from '../primitives/Badge';
import { cn } from '../utils';
import {
  fmtPct,
  shortDate,
  shortHash,
  deltaClass,
  pctDeltaText,
  buildConfigBadges,
  rankBadge,
  BUCKET_LABELS,
} from '../retrievalUtils';

const GRID = '62px 46px 140px 26px 32px 32px 30px 58px minmax(60px,1fr) 16px';
const SUBGRID = '1fr 1fr 100px 100px';

function SortHead({ label, sortKey, active, dir, onSort, align = 'left' }) {
  return (
    <span
      className={cn(
        'font-mono text-text-faint text-[10px] tracking-[0.12em] uppercase cursor-pointer',
        align === 'right' && 'text-right'
      )}
      onClick={() => onSort(sortKey)}
    >
      {label} {active ? (dir === 'asc' ? '▲' : '▼') : ''}
    </span>
  );
}

export default function EvalRunsSection({ runs, queryCache, onFetchQueries }) {
  const [sortKey, setSortKey] = useState('run_at');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedRunId, setExpandedRunId] = useState(null);

  const handleSort = (key) => {
    setSortDir((prevDir) => (sortKey === key ? (prevDir === 'asc' ? 'desc' : 'asc') : 'desc'));
    setSortKey(key);
  };

  const handleToggle = (runId) => {
    setExpandedRunId((prev) => (prev === runId ? null : runId));
    onFetchQueries(runId);
  };

  const sorted = runs.slice().sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <section id="runs" className="scroll-mt-14">
      <SectionHeader eyebrow="Eval runs" title="Every golden-set run" count={runs.length} />
      <div className="border border-border-faint bg-bg-panel-strong rounded-xl overflow-hidden mt-5">
        <div
          className="grid items-center gap-1.5 px-[10px] py-[9px] border-b border-border-faint bg-bg-panel"
          style={{ gridTemplateColumns: GRID }}
        >
          <SortHead label="Date" sortKey="run_at" active={sortKey === 'run_at'} dir={sortDir} onSort={handleSort} />
          <span className="font-mono text-text-faint text-[10px] tracking-[0.12em] uppercase">Golden set</span>
          <span className="font-mono text-text-faint text-[10px] tracking-[0.12em] uppercase">Config</span>
          <SortHead label="#Q" sortKey="num_queries" active={sortKey === 'num_queries'} dir={sortDir} onSort={handleSort} align="right" />
          <SortHead label="R@1" sortKey="recall_at_1" active={sortKey === 'recall_at_1'} dir={sortDir} onSort={handleSort} align="right" />
          <SortHead label="R@5" sortKey="recall_at_5" active={sortKey === 'recall_at_5'} dir={sortDir} onSort={handleSort} align="right" />
          <SortHead label="MRR" sortKey="mrr" active={sortKey === 'mrr'} dir={sortDir} onSort={handleSort} align="right" />
          <span className="font-mono text-text-faint text-[10px] tracking-[0.12em] uppercase text-right">Δ R@1</span>
          <span className="font-mono text-text-faint text-[10px] tracking-[0.12em] uppercase">Notes</span>
          <span />
        </div>

        {sorted.length === 0 ? (
          <div className="px-4 py-7 text-center font-mono text-[12.5px] text-text-disabled">no eval runs yet</div>
        ) : (
          sorted.map((run) => {
            const isExpanded = expandedRunId === run.id;
            const cached = queryCache[run.id];
            return (
              <div key={run.id}>
                <div
                  className="grid items-center gap-1.5 px-[10px] py-3 border-b border-border-faintest cursor-pointer"
                  style={{ gridTemplateColumns: GRID }}
                  onClick={() => handleToggle(run.id)}
                >
                  <span className="font-mono text-text-secondary text-[12px]">{shortDate(run.run_at)}</span>
                  <span className="font-mono text-text-muted text-[11.5px]">{shortHash(run.golden_set_fingerprint)}</span>
                  <div className="flex items-center gap-[5px] flex-wrap">
                    {buildConfigBadges(run).map((cb) => (
                      <Badge key={cb.label} tone={cb.tone} size="xxs">{cb.label}</Badge>
                    ))}
                  </div>
                  <span className="font-mono text-text-secondary text-[12px] text-right block">{run.num_queries}</span>
                  <span className="font-mono text-text-primary tabular-nums text-[12.5px] text-right block">{fmtPct(run.recall_at_1)}</span>
                  <span className="font-mono text-text-primary tabular-nums text-[12.5px] text-right block">{fmtPct(run.recall_at_5)}</span>
                  <span className="font-mono text-text-primary tabular-nums text-[12.5px] text-right block">{run.mrr.toFixed(2)}</span>
                  <span className={cn('font-mono text-[11px] text-right block', deltaClass(run.delta ? run.delta.recall_at_1 : null))}>
                    {run.delta ? pctDeltaText(run.delta.recall_at_1) : '—'}
                  </span>
                  <span className="text-text-muted text-[12px] block overflow-hidden text-ellipsis whitespace-nowrap" title={run.notes}>
                    {run.notes}
                  </span>
                  <span className="text-text-faint text-[13px] block text-right">{isExpanded ? '−' : '+'}</span>
                </div>

                {isExpanded && (
                  <div className="bg-bg-hover border-b border-border-faintest p-4">
                    <div className="font-mono text-text-faint text-[10px] tracking-[0.12em] uppercase mb-2">Per-query results</div>
                    <div className="border border-border-faintest rounded-[10px] overflow-hidden">
                      <div className="grid items-center gap-3.5 px-3 py-2 bg-bg-panel" style={{ gridTemplateColumns: SUBGRID }}>
                        <span className="font-mono text-text-faint text-[9.5px] tracking-[0.1em] uppercase">Query</span>
                        <span className="font-mono text-text-faint text-[9.5px] tracking-[0.1em] uppercase">Expected bookmark</span>
                        <span className="font-mono text-text-faint text-[9.5px] tracking-[0.1em] uppercase">Bucket</span>
                        <span className="font-mono text-text-faint text-[9.5px] tracking-[0.1em] uppercase text-right">Found rank</span>
                      </div>
                      {cached === 'loading' || cached === undefined ? (
                        <div className="px-3 py-4 text-center font-mono text-[12px] text-text-faint">Loading…</div>
                      ) : cached === 'error' ? (
                        <div className="px-3 py-4 text-center font-mono text-[12px] text-accent-error">Couldn't load per-query results.</div>
                      ) : cached.length === 0 ? (
                        <div className="px-3 py-4 text-center font-mono text-[12px] text-text-faint">No queries in this run.</div>
                      ) : (
                        cached.map((q) => {
                          const badge = rankBadge(q.found_rank);
                          return (
                            <div
                              key={q.id}
                              className="grid items-center gap-3.5 px-3 py-[9px] border-t border-border-faintest"
                              style={{ gridTemplateColumns: SUBGRID }}
                            >
                              <span className="text-text-secondary text-[12px]">{q.query_text}</span>
                              <span className="text-text-muted text-[12px]">{q.expected_bookmark_title}</span>
                              <span className="font-mono text-text-faint text-[10.5px]">{BUCKET_LABELS[q.bucket] || q.bucket}</span>
                              <div className="flex justify-end">
                                <Badge tone={badge.tone} size="xs">{badge.text}</Badge>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
