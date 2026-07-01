import { cn } from '../utils';

export default function SectionHeader({ eyebrow, eyebrowTag, count, title, description, className = '' }) {
  return (
    <div className={className}>
      <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-text-faint">
        {eyebrow}
        {eyebrowTag && <span className="text-accent-warning"> · {eyebrowTag}</span>}
        {count != null && <span className="text-text-disabled"> · {count}</span>}
      </div>
      <h2 className={cn('text-[21px] font-semibold tracking-tight text-text-primary mt-[7px]', description ? 'mb-0' : 'mb-0')}>
        {title}
      </h2>
      {description && (
        <p className="text-text-muted text-[13.5px] leading-relaxed mt-[6px]">{description}</p>
      )}
    </div>
  );
}
