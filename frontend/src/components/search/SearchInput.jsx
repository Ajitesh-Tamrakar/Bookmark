export default function SearchInput({ value, onChange, onClear, loading, showClear }) {
  return (
    <div className="relative flex items-center mt-[34px]">
      <span className="absolute left-[18px] flex text-text-faint pointer-events-none z-10">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </span>

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Search your library by meaning, not keywords…"
        className="w-full bg-bg-raised border border-border-default rounded-[13px] text-text-primary font-sans text-[16px] pl-[48px] pr-[110px] py-[16px] outline-none transition-all focus:border-border-strong focus:shadow-[0_0_0_3px_rgba(250,250,250,0.05)]"
      />

      <div className="absolute right-[13px] flex items-center gap-2">
        {loading && (
          <span className="w-[15px] h-[15px] border-2 border-border-default border-t-text-primary rounded-full animate-spin flex-none" />
        )}
        {showClear && !loading && (
          <button
            type="button"
            onClick={onClear}
            className="bg-transparent border border-border-strong rounded-[7px] text-text-muted font-mono text-[11px] cursor-pointer px-[9px] py-[5px] hover:text-text-secondary transition-colors"
          >
            clear ✕
          </button>
        )}
      </div>
    </div>
  );
}
