import { cn } from '../utils';

const TONE_CLASSES = {
  warning: 'border-accent-warning/30 bg-accent-warning/7',
  error: 'border-accent-error/30 bg-accent-error/7',
  info: 'border-accent-info/30 bg-accent-info/7',
  success: 'border-accent-success/30 bg-accent-success/7',
};

const TITLE_TONE_CLASSES = {
  warning: 'text-accent-warning-text',
  error: 'text-accent-error',
  info: 'text-accent-info',
  success: 'text-accent-success',
};

export default function Callout({ tone = 'warning', icon, title, children, className = '' }) {
  return (
    <div className={cn('rounded-[10px] border px-4 py-[14px] flex gap-3', TONE_CLASSES[tone], className)}>
      {icon && <div className={cn('shrink-0 mt-[1px]', TITLE_TONE_CLASSES[tone])}>{icon}</div>}
      <div className="min-w-0">
        {title && <p className={cn('text-[13px] font-semibold mb-[4px]', TITLE_TONE_CLASSES[tone])}>{title}</p>}
        <div className="text-[13px] text-text-muted leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
