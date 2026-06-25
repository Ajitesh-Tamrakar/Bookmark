const SIZES = ['tiny', 'base', 'small', 'medium', 'large'];

export default function TranscriptionSection({ whisper, onSetWhisper }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between text-[11px] text-text-faint font-mono">
        <span>← Faster</span>
        <span>More accurate →</span>
      </div>
      <div className="flex gap-2">
        {SIZES.map((size) => {
          const isActive = whisper === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => onSetWhisper(size)}
              className={[
                'flex-1 py-[9px] rounded-[8px] border text-[13px] font-medium transition-colors cursor-pointer',
                isActive
                  ? 'bg-bg-sunken border-border-strong text-text-primary'
                  : 'bg-transparent border-border-subtle text-text-faint hover:border-border-default hover:text-text-muted',
              ].join(' ')}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
