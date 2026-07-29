const BOOK_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.7L5 21V4a1 1 0 0 1 1-1z" stroke="var(--color-icon-muted)" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);
const SEARCH_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="var(--color-icon-muted)" strokeWidth="1.5" />
    <path d="M16.5 16.5L21 21" stroke="var(--color-icon-muted)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const LIST_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M4 5h16M4 12h16M4 19h16" stroke="var(--color-icon-muted)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const VARIANTS = {
  'empty-library': {
    icon: BOOK_ICON,
    title: 'Your library is empty',
    text: "Nothing has been saved yet — there's nothing to search. Save your first link from the browser extension or the share sheet, and it'll show up here once it finishes processing.",
  },
  'no-match': {
    icon: SEARCH_ICON,
    title: 'Nothing close to that',
    text: "Nothing in your library is a close enough match for this query. Your library isn't empty — try Deep search below to check every saved item with no shortcuts, rephrase, or browse by tag.",
  },
  'empty-browse': {
    icon: LIST_ICON,
    title: 'No bookmarks match all selected tags',
    text: null,
  },
};

function SuggChip({ name, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 bg-accent-warning/5 border border-accent-warning/28 rounded-[7px] text-accent-warning-text font-mono text-[11.5px] cursor-pointer px-[11px] py-[5px] hover:border-accent-warning/50 transition-all"
    >
      <span className="w-[4px] h-[4px] rounded-full bg-accent-tag-ai flex-none" />
      {name}
    </button>
  );
}

export default function EmptyState({ variant, tagPhrase, suggestedTags = [], onClearAll, onPickTag, action }) {
  const v = VARIANTS[variant] || VARIANTS['no-match'];

  return (
    <div className="border border-dashed border-border-default rounded-[16px] px-8 py-[54px] text-center flex flex-col items-center gap-1.5 mt-1">
      <div className="w-[46px] h-[46px] rounded-[13px] border border-border-default bg-bg-raised flex items-center justify-center mb-3">
        {v.icon}
      </div>
      <div className="text-[17px] font-semibold tracking-tight text-text-primary">{v.title}</div>
      <p className="text-[13px] text-text-muted max-w-[33em] leading-[1.6] mt-1.5 m-0">
        {v.text || (tagPhrase
          ? `No bookmark carries all of — ${tagPhrase} — at once. Remove a tag to widen the set.`
          : 'Remove a tag to widen the set.'
        )}
      </p>

      {variant === 'empty-browse' && (
        <div className="flex items-center gap-2 flex-wrap mt-3 justify-center">
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 bg-accent-warning/5 border border-accent-warning/28 rounded-[7px] text-accent-warning-text font-mono text-[11.5px] cursor-pointer px-[11px] py-[5px] hover:border-accent-warning/50 transition-all"
          >
            clear all tags ✕
          </button>
        </div>
      )}

      {variant === 'no-match' && suggestedTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mt-3 justify-center">
          <span className="font-mono text-[11px] text-text-amber-muted">browse:</span>
          {suggestedTags.map((name) => (
            <SuggChip key={name} name={name} onClick={() => onPickTag(name)} />
          ))}
        </div>
      )}

      {variant === 'no-match' && action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  );
}
