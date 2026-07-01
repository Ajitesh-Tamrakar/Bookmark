import { cn } from '../utils';

const TRACK_CLASSES = {
  sunken: 'bg-bg-sunken',
  subtle: 'bg-border-subtle',
};

const FILL_CLASSES = {
  primary: 'bg-text-primary',
  success: 'bg-accent-success',
  faint: 'bg-border-strong',
};

export default function ProgressBar({ percent, track = 'sunken', fill = 'primary', height = 4, className = '' }) {
  return (
    <div
      className={cn('rounded-full overflow-hidden', TRACK_CLASSES[track], className)}
      style={{ height }}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-200', FILL_CLASSES[fill])}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
