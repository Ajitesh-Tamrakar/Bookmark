import { cn } from '../utils';

const VARIANT_CLASSES = {
  panel: 'border border-border-faint bg-bg-panel rounded-xl px-[18px] py-4',
  table: 'border border-border-faint bg-bg-panel-strong rounded-xl overflow-hidden',
  sunken: 'border border-border-subtle bg-bg-sunken rounded-[8px] px-4 py-[10px]',
  raised: 'border border-border-subtle bg-bg-raised rounded-[13px]',
};

export default function Card({ variant = 'panel', className = '', children, ...rest }) {
  return (
    <div className={cn(VARIANT_CLASSES[variant], className)} {...rest}>
      {children}
    </div>
  );
}
