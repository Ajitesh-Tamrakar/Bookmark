export default function SetupNav({ items, activeSection }) {
  return (
    <nav className="sticky top-[72px] w-[148px] shrink-0 flex flex-col gap-[2px]">
      {items.map((item) => {
        const isActive = item.id === activeSection;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={[
              'flex items-center gap-[10px] px-2 py-[7px] rounded-[6px] text-[13px] font-medium no-underline transition-colors',
              isActive
                ? 'text-text-primary'
                : 'text-text-faint hover:text-text-muted',
            ].join(' ')}
          >
            <span
              className={[
                'w-[6px] h-[6px] rounded-full shrink-0 transition-colors',
                isActive ? 'bg-text-primary' : 'bg-text-faint opacity-40',
              ].join(' ')}
            />
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
