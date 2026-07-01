import { cn } from '../utils';

const TONE_CLASSES = {
  neutral: 'text-text-secondary border-border-default bg-bg-sunken',
  muted: 'text-text-muted border-border-default bg-bg-raised',
  error: 'text-accent-error border-accent-error/30 bg-accent-error/7',
  warning: 'text-accent-warning-text border-accent-warning/35 bg-accent-warning/6',
  info: 'text-accent-info border-accent-info/30 bg-accent-info/7',
  success: 'text-accent-success border-accent-success/30 bg-accent-success/7',
  audio: 'text-accent-audio border-accent-audio/30 bg-accent-audio/7',
  tagAi: 'text-accent-tag-ai border-accent-tag-ai/26 bg-accent-tag-ai/6',
  youtube: 'text-accent-youtube border-accent-youtube/32 bg-accent-youtube/7',
  linkedin: 'text-accent-linkedin border-accent-linkedin/32 bg-accent-linkedin/7',
  pinterest: 'text-accent-pinterest border-accent-pinterest/32 bg-accent-pinterest/7',
  web: 'text-accent-web border-accent-web/32 bg-accent-web/6',
  locked: 'text-accent-warning font-semibold uppercase tracking-wide border-accent-warning/30 bg-accent-warning/12',
};

const DOT_TONE_CLASSES = {
  tagAi: 'bg-accent-tag-ai',
  warning: 'bg-accent-warning-text',
  error: 'bg-accent-error',
  success: 'bg-accent-success',
};

const SIZE_CLASSES = {
  xs: 'text-[10px] px-[7px] py-[2px] rounded-[5px] gap-1',
  xxs: 'text-[9.5px] tracking-[0.05em] px-[7px] py-[2px] rounded-[5px] gap-1',
  pill: 'text-[10px] px-[7px] py-[5px] rounded-[6px] gap-1 min-w-[34px] justify-center',
  tag: 'text-[10px] px-2 py-[3px] rounded-[5px] gap-[5px]',
  chip: 'text-[10px] px-2 py-[2px] rounded-[5px] gap-1',
};

export default function Badge({ tone = 'neutral', size = 'xs', dot = false, className = '', children }) {
  return (
    <span
      className={cn(
        'font-mono tracking-[0.04em] border inline-flex items-center',
        SIZE_CLASSES[size],
        TONE_CLASSES[tone],
        className
      )}
    >
      {dot && <span className={cn('w-[4px] h-[4px] rounded-full flex-none', DOT_TONE_CLASSES[tone] || 'bg-current')} />}
      {children}
    </span>
  );
}
