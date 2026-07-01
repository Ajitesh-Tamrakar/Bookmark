import { cn } from '../utils';

export default function ScrollSpyNav({
  items,
  activeSection,
  label,
  sticky = 'top-10',
  width = 'w-[140px]',
  itemPadded = false,
  alwaysMedium = false,
  inactiveDotClass = 'bg-dot-inactive',
}) {
  return (
    <nav className={cn('sticky shrink-0 flex flex-col gap-[2px]', sticky, width)}>
      {label && (
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-text-faint pb-[14px]">
          {label}
        </div>
      )}
      {items.map((item) => {
        const isActive = item.id === activeSection;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              'flex items-center text-[13px] no-underline transition-colors',
              itemPadded ? 'gap-[10px] px-2 py-[7px] rounded-[6px]' : 'gap-[9px] py-[5px]',
              (alwaysMedium || isActive) && 'font-medium',
              isActive ? 'text-text-primary' : 'text-text-faint hover:text-text-muted'
            )}
          >
            <span
              className={cn(
                'w-[6px] h-[6px] rounded-full shrink-0 transition-colors',
                isActive ? 'bg-text-primary' : inactiveDotClass
              )}
            />
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
