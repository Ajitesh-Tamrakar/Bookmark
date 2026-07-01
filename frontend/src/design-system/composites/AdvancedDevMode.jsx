import Switch from '../primitives/Switch';

export default function AdvancedDevMode({ devMode, onToggleDev, advancedOpen, onToggleAdvanced }) {
  return (
    <div className="border border-border-subtle rounded-[10px] overflow-hidden">
      <button
        type="button"
        onClick={onToggleAdvanced}
        className="w-full flex items-center justify-between px-4 py-[13px] text-left text-[13px] font-medium text-text-muted hover:text-text-secondary transition-colors cursor-pointer bg-transparent"
      >
        <span>Advanced</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-text-faint transition-transform duration-200"
          style={{ transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M2.5 5l4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {advancedOpen && (
        <div className="px-4 pb-4 border-t border-border-subtle flex flex-col gap-3 pt-4 animate-fade-up">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-text-secondary mb-[4px]">Developer mode</p>
              <p className="text-[12px] text-text-faint leading-relaxed">
                Enables verbose pipeline logs, skips the readiness check gate, and surfaces internal
                debug fields in the bookmark detail view. Intended for contributors and power users.
              </p>
            </div>
            <Switch checked={devMode} onChange={onToggleDev} />
          </div>
        </div>
      )}
    </div>
  );
}
