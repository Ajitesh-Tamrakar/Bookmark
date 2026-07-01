import { cn } from '../utils';

export default function Switch({ checked, onChange, disabled = false, className = '' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative w-9 h-[21px] rounded-full cursor-pointer border transition-all p-0 disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-text-primary border-border-strong' : 'bg-bg-sunken border-switch-track-off',
        className
      )}
    >
      <span
        className={cn(
          'absolute top-[2px] w-[15px] h-[15px] rounded-full transition-all',
          checked ? 'left-[17px] bg-bg-base' : 'left-[2px] bg-switch-thumb-off'
        )}
      />
    </button>
  );
}
