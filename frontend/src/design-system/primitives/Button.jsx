import { cn } from '../utils';

const SIZE_CLASSES = {
  sm: 'text-[12px] px-3 py-[6px] rounded-[7px] gap-1.5',
  md: 'text-[13px] px-4 py-[8px] rounded-[8px] gap-2',
  lg: 'text-[14px] px-4 py-[13px] rounded-[10px] gap-2 font-semibold',
};

const VARIANT_CLASSES = {
  ghost: 'bg-transparent border border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary',
  primary: 'bg-text-primary text-bg-base border border-transparent hover:opacity-90',
  'primary-disabled': 'bg-border-subtle text-text-faint border border-transparent opacity-60',
  danger: 'bg-accent-error text-bg-base border border-transparent hover:opacity-90',
  'ghost-danger': 'bg-transparent border border-accent-error/40 text-accent-error hover:bg-accent-error/10',
};

export default function Button({
  variant = 'ghost',
  size = 'md',
  fullWidth = false,
  mono = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const variantKey = variant === 'primary' && disabled ? 'primary-disabled' : variant;
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-medium tracking-tight transition-colors cursor-pointer disabled:cursor-not-allowed',
        mono ? 'font-mono' : 'font-sans',
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variantKey],
        fullWidth && 'w-full',
        !disabled && variant !== 'primary' && 'disabled:opacity-50',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
