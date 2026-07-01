import { cn } from '../utils';

export default function SegmentedControl({ options, value, onChange, columns, variant = 'simple' }) {
  const isCard = variant === 'card';
  return (
    <div
      className={isCard ? 'grid gap-3' : 'flex gap-2'}
      style={isCard && columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        if (isCard) {
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex flex-col gap-[5px] px-4 py-[14px] rounded-[10px] border text-left transition-colors cursor-pointer',
                isActive
                  ? 'bg-bg-sunken border-border-strong text-text-primary'
                  : 'bg-transparent border-border-subtle text-text-muted hover:border-border-default hover:text-text-secondary'
              )}
            >
              <span className="text-[14px] font-semibold leading-tight">{opt.label}</span>
              {opt.sub && <span className="text-[12px] leading-snug opacity-70">{opt.sub}</span>}
            </button>
          );
        }
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 py-[9px] rounded-[8px] border text-[13px] font-medium transition-colors cursor-pointer',
              isActive
                ? 'bg-bg-sunken border-border-strong text-text-primary'
                : 'bg-transparent border-border-subtle text-text-faint hover:border-border-default hover:text-text-muted'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
