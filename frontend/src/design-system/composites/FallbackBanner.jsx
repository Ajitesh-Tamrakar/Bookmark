export default function FallbackBanner({ suggestedTags, onPickTag }) {
  return (
    <div className="flex gap-[13px] border-l-2 border-accent-warning bg-accent-warning/6 rounded-r-[10px] px-[17px] py-[15px] mb-[18px]">
      <svg width="17" height="17" viewBox="0 0 24 24" className="flex-none mt-[1px]" fill="none">
        <path d="M12 3l10 18H2z" fill="rgba(217,167,46,0.18)" stroke="#e6b13c" strokeWidth="1.4" strokeLinejoin="round" />
        <rect x="11.1" y="9" width="1.8" height="6" rx="0.9" fill="#e6b13c" />
        <circle cx="12" cy="17.4" r="1.05" fill="#e6b13c" />
      </svg>
      <div>
        <div className="text-accent-warning-text font-semibold text-[13.5px] mb-[5px]">
          No exact matches — showing approximate results
        </div>
        <p className="text-text-amber-body text-[12.5px] leading-[1.55] m-0">
          Nothing cleared the usual similarity threshold for this query, so the threshold was broadened. These are the closest things in your library.
        </p>
        {suggestedTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <span className="font-mono text-[11px] text-text-amber-muted">browse instead:</span>
            {suggestedTags.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onPickTag(name)}
                className="inline-flex items-center gap-1.5 bg-accent-warning/5 border border-accent-warning/28 rounded-[7px] text-accent-warning-text font-mono text-[11.5px] cursor-pointer px-[11px] py-[5px] hover:border-accent-warning/50 transition-all"
              >
                <span className="w-[4px] h-[4px] rounded-full bg-accent-tag-ai flex-none" />
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
