export default function PipelineNav({ items, activeSection }) {
  return (
    <nav className="sticky top-10 w-[140px] shrink-0 flex flex-col gap-[2px]">
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-text-faint pb-[14px]">
        Monitor
      </div>
      {items.map((item) => {
        const isActive = item.id === activeSection;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={[
              'flex items-center gap-[9px] py-[5px] text-[13px] no-underline transition-colors',
              isActive ? 'text-text-primary font-medium' : 'text-text-faint hover:text-text-muted',
            ].join(' ')}
          >
            <span
              className={[
                'w-[6px] h-[6px] rounded-full shrink-0 transition-colors',
                isActive ? 'bg-text-primary' : 'bg-[#33323a]',
              ].join(' ')}
            />
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
