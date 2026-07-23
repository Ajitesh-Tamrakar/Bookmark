import { useState, useEffect } from 'react';
import SectionHeader from '../primitives/SectionHeader';
import Card from '../primitives/Card';
import Select from '../primitives/Select';
import BreakdownChart from './BreakdownChart';
import { aggregateBuckets, shortDate, shortHash } from '../retrievalUtils';

export default function BreakdownSection({ runs, queryCache, onFetchQueries }) {
  const [selectedRunId, setSelectedRunId] = useState(null);
  const effectiveRunId = selectedRunId ?? runs[0]?.id ?? null;

  useEffect(() => {
    if (effectiveRunId) onFetchQueries(effectiveRunId);
  }, [effectiveRunId, onFetchQueries]);

  const runOptions = runs.map((r) => ({ value: r.id, label: `${shortDate(r.run_at)} · ${shortHash(r.golden_set_fingerprint)}` }));
  const cached = effectiveRunId ? queryCache[effectiveRunId] : undefined;
  const buckets = Array.isArray(cached) ? aggregateBuckets(cached) : [];

  return (
    <section id="breakdown" className="scroll-mt-14">
      <SectionHeader eyebrow="Breakdown" title="Which kind of query is weak right now" />
      <div className="flex items-center justify-between mt-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-accent-info)' }} />
            <span className="font-mono text-text-muted text-[11px]">Recall@1</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-accent-success)' }} />
            <span className="font-mono text-text-muted text-[11px]">Recall@5</span>
          </div>
        </div>
        {runOptions.length > 0 && (
          <div className="w-[230px]">
            <Select
              options={runOptions}
              value={effectiveRunId ?? ''}
              onChange={(e) => setSelectedRunId(e.target.value)}
            />
          </div>
        )}
      </div>
      <Card variant="panel">
        {runOptions.length === 0 ? (
          <div className="text-text-faint font-mono text-[12.5px] text-center py-8">
            No eval runs yet — nothing to break down.
          </div>
        ) : cached === 'loading' || cached === undefined ? (
          <div className="text-text-faint font-mono text-[12.5px] text-center py-8">Loading…</div>
        ) : cached === 'error' ? (
          <div className="text-accent-error font-mono text-[12.5px] text-center py-8">Couldn't load per-query results.</div>
        ) : buckets.length === 0 ? (
          <div className="text-text-faint font-mono text-[12.5px] text-center py-8">No queries in this run.</div>
        ) : (
          <BreakdownChart buckets={buckets} />
        )}
      </Card>
    </section>
  );
}
