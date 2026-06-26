export default function TagRail({ tags, selectedTags, onToggleTag, onClearAll }) {
  if (!tags.length) return null;
  const anySelected = selectedTags.length > 0;

  return (
    <div className="mt-[18px]">
      <div className="flex items-center gap-2.5">
        <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-[6px] flex-1 min-w-0 [scrollbar-width:thin] [scrollbar-color:#26252b_transparent]">
          {tags.map((tag) => {
            const on = selectedTags.includes(tag.name);
            return (
              <button
                key={tag.name}
                type="button"
                onClick={() => onToggleTag(tag.name)}
                className={[
                  'flex-none flex items-center gap-2 border rounded-[9px] text-[12.5px] font-sans px-[13px] py-[7px] cursor-pointer whitespace-nowrap transition-all',
                  on
                    ? 'bg-bg-sunken border-border-strong text-text-primary'
                    : 'bg-transparent border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary',
                ].join(' ')}
              >
                <span className={`w-[6px] h-[6px] rounded-full flex-none transition-all ${on ? 'bg-text-primary' : 'bg-border-strong'}`} />
                {tag.name}
                <span className={`font-mono text-[11px] ${on ? 'text-text-muted' : 'text-text-faint'}`}>
                  {tag.count}
                </span>
              </button>
            );
          })}
        </div>
        {anySelected && (
          <button
            type="button"
            onClick={onClearAll}
            className="flex-none bg-transparent border-none text-text-faint font-mono text-[11.5px] cursor-pointer px-1 py-[6px] whitespace-nowrap hover:text-text-muted transition-colors"
          >
            clear all ✕
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mt-[13px] font-mono text-[11px] text-text-faint">
        <span className="flex items-center gap-1.5">
          <span className="w-[5px] h-[5px] rounded-full bg-accent-tag-ai" />
          ai-generated tag
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-[7px] h-[7px] rounded-[2px] border border-border-strong bg-bg-raised" />
          manually added
        </span>
      </div>
    </div>
  );
}
