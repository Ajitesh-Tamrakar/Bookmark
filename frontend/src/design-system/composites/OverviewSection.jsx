import SectionHeader from '../primitives/SectionHeader';
import StatSparkCard from './StatSparkCard';
import { fmtPct, deltaClass, pctDeltaText, decDeltaText, buildSpark } from '../retrievalUtils';

export default function OverviewSection({ runs }) {
  const latest = runs[0] || null;
  const ascValues = runs.slice().reverse();

  const recall1Spark = buildSpark(ascValues.map((r) => r.recall_at_1), 64, 24);
  const recall5Spark = buildSpark(ascValues.map((r) => r.recall_at_5), 64, 24);
  const mrrSpark = buildSpark(ascValues.map((r) => r.mrr), 64, 24);

  return (
    <section id="overview" className="scroll-mt-14">
      <SectionHeader eyebrow="Overview" title="How good is search, right now" />
      <div className="flex gap-3 mt-5">
        {!latest ? (
          <div className="flex-1 text-text-faint font-mono text-[12.5px] border border-dashed border-border-default rounded-xl px-[18px] py-8 text-center">
            No eval runs yet — upload a golden set and run an evaluation to see scores here.
          </div>
        ) : (
          <>
            <StatSparkCard
              label="Recall@1"
              value={fmtPct(latest.recall_at_1)}
              deltaText={pctDeltaText(latest.delta ? latest.delta.recall_at_1 : null)}
              deltaClass={deltaClass(latest.delta ? latest.delta.recall_at_1 : null)}
              sparkPoints={recall1Spark}
              sparkColor="var(--color-accent-info)"
            />
            <StatSparkCard
              label="Recall@5"
              value={fmtPct(latest.recall_at_5)}
              deltaText={pctDeltaText(latest.delta ? latest.delta.recall_5 : null)}
              deltaClass={deltaClass(latest.delta ? latest.delta.recall_5 : null)}
              sparkPoints={recall5Spark}
              sparkColor="var(--color-accent-success)"
            />
            <StatSparkCard
              label="MRR"
              value={latest.mrr.toFixed(2)}
              deltaText={decDeltaText(latest.delta ? latest.delta.mrr : null)}
              deltaClass={deltaClass(latest.delta ? latest.delta.mrr : null)}
              sparkPoints={mrrSpark}
              sparkColor="var(--color-accent-tag-ai)"
            />
          </>
        )}
      </div>
    </section>
  );
}
