const OPTIONS = [
  { id: 'ollama', title: 'Ollama', sub: 'Recommended · fully local' },
  { id: 'openai', title: 'OpenAI', sub: 'Hosted · needs API key' },
  { id: 'custom', title: 'Customize', sub: 'Set each model' },
];

export default function ProviderToggle({ top, onSetTop }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {OPTIONS.map((opt) => {
        const isActive = top === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSetTop(opt.id)}
            className={[
              'flex flex-col gap-[5px] px-4 py-[14px] rounded-[10px] border text-left transition-colors cursor-pointer',
              isActive
                ? 'bg-bg-sunken border-border-strong text-text-primary'
                : 'bg-transparent border-border-subtle text-text-muted hover:border-border-default hover:text-text-secondary',
            ].join(' ')}
          >
            <span className="text-[14px] font-semibold leading-tight">{opt.title}</span>
            <span className="text-[12px] leading-snug opacity-70">{opt.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
