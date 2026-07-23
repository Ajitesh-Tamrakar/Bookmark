import SectionHeader from '../primitives/SectionHeader';
import Card from '../primitives/Card';
import TrendChart from './TrendChart';

export default function TrendSection({ runs }) {
  const ascRuns = runs.slice().reverse();

  return (
    <section id="trend" className="scroll-mt-14">
      <SectionHeader
        eyebrow="Trend"
        title="Recall & MRR over time"
        description="Hover a point for exact values and the config snapshot that produced them."
      />
      <Card variant="panel" className="mt-5">
        {ascRuns.length === 0 ? (
          <div className="text-text-faint font-mono text-[12.5px] text-center py-8">
            No eval runs yet — nothing to trend.
          </div>
        ) : (
          <TrendChart runs={ascRuns} />
        )}
      </Card>
    </section>
  );
}
