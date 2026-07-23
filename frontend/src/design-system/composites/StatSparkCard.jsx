import Card from '../primitives/Card';
import { cn } from '../utils';

export default function StatSparkCard({ label, value, deltaText, deltaClass, sparkPoints, sparkColor }) {
  return (
    <Card variant="panel" className="flex-1">
      <div className="font-mono text-text-faint text-[11px] tracking-[0.1em] uppercase">{label}</div>
      <div className="text-text-primary font-semibold tabular-nums text-[32px] tracking-[-0.02em] leading-none mt-[9px]">
        {value}
      </div>
      <div className="flex items-center gap-[7px] mt-[9px]">
        <span className={cn('font-mono text-[11.5px]', deltaClass)}>{deltaText}</span>
        <span className="font-mono text-text-faint text-[10.5px]">vs prev run</span>
      </div>
      <svg width="100%" height="24" viewBox="0 0 64 24" preserveAspectRatio="none" className="block mt-3">
        <polyline points={sparkPoints} fill="none" stroke={sparkColor} strokeWidth="1.6" />
      </svg>
    </Card>
  );
}
