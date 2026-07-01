import SectionHeader from '../primitives/SectionHeader';
import Card from '../primitives/Card';
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
      <SectionHeader eyebrow="Summary" title="Status counts" />
      <SqlHint>
        {`SELECT processing_status, COUNT(*) FROM bookmarks GROUP BY processing_status;`}
      </SqlHint>
      <div className="flex gap-3">
        {summary.map((s) => (
          <Card key={s.label} variant="panel" className="flex-1">
            <div
              className={[
                'text-[30px] font-semibold tracking-[-0.02em] leading-none tabular-nums',
                s.isError ? 'text-accent-error' : 'text-text-primary',
              ].join(' ')}
            >
              {s.value}
            </div>
            <div className="flex items-center gap-2 mt-[11px]">
              <span className={['w-[7px] h-[7px] rounded-full shrink-0', DOT_CLASSES[s.dotKey]].join(' ')} />
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-text-faint">
                {s.label}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
