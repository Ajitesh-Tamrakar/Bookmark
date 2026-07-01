import { cn } from '../utils';

export default function Select({ label, options, className = '', selectClassName = '', ...rest }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <label className="text-[12px] font-medium text-text-muted">{label}</label>}
      <div className="relative">
        <select
          className={cn(
            'w-full appearance-none bg-bg-sunken border border-border-default rounded-[8px] text-text-primary text-[13px] px-3 py-[8px] pr-8 outline-none transition-colors focus:border-border-strong cursor-pointer',
            selectClassName
          )}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          width="11"
          height="11"
          viewBox="0 0 14 14"
          fill="none"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none"
        >
          <path d="M2.5 5l4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
