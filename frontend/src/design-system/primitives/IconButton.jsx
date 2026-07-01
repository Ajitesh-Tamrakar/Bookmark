import { cn } from '../utils';

const TONE_CLASSES = {
  default: 'hover:border-border-strong hover:text-text-primary',
  danger: 'hover:border-accent-error/40 hover:text-accent-error',
};

export default function IconButton({ tone = 'default', className = '', children, ...rest }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center bg-transparent border border-border-default rounded-[7px] text-text-faint p-[6px] cursor-pointer transition-all',
        TONE_CLASSES[tone],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
