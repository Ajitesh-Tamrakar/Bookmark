import { cn } from '../utils';

export default function Input({ label, trailing, className = '', inputClassName = '', ...rest }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <label className="text-[12px] font-medium text-text-muted">{label}</label>}
      <div className="relative flex items-center">
        <input
          className={cn(
            'w-full bg-bg-sunken border border-border-default rounded-[8px] text-text-primary text-[13px] px-3 py-[8px] outline-none transition-colors focus:border-border-strong placeholder:text-text-faint',
            trailing && 'pr-14',
            inputClassName
          )}
          {...rest}
        />
        {trailing && <div className="absolute right-3 flex items-center">{trailing}</div>}
      </div>
    </div>
  );
}
