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
        'relative cursor-pointer transition-all p-0 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      style={{
        width: '38px',
        height: '22px',
        borderRadius: '999px',
        border: `1px solid ${checked ? 'var(--color-border-strong)' : 'transparent'}`,
        background: checked ? 'var(--color-text-primary)' : 'var(--color-switch-track-off)',
        flex: '0 0 auto',
      }}
    >
      <span
        className="absolute rounded-full transition-all"
        style={{
          top: '2px',
          width: '16px',
          height: '16px',
          left: checked ? '18px' : '2px',
          background: checked ? 'var(--color-bg-base)' : 'var(--color-switch-thumb-off)',
        }}
      />
    </button>
  );
}
