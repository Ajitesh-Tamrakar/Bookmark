import Input from '../primitives/Input';

const PROV_LABEL = { openai: 'OpenAI', anthropic: 'Anthropic', google: 'Google' };
const PROV_PLACEHOLDER = {
  openai: 'sk-...',
  anthropic: 'sk-ant-...',
  google: 'AIza...',
};

export default function ApiKeysSection({ neededProviders, keys, showKey, onSetKey, onToggleShowKey }) {
  if (!neededProviders.length) return null;

  return (
    <div className="flex flex-col gap-4">
      {neededProviders.map((prov) => (
        <Input
          key={prov}
          label={`${PROV_LABEL[prov]} API key`}
          type={showKey[prov] ? 'text' : 'password'}
          value={keys[prov] || ''}
          onChange={(e) => onSetKey(prov, e.target.value)}
          placeholder={PROV_PLACEHOLDER[prov] || 'API key'}
          trailing={
            <button
              type="button"
              onClick={() => onToggleShowKey(prov)}
              className="text-[12px] text-text-faint hover:text-text-muted transition-colors cursor-pointer px-1"
            >
              {showKey[prov] ? 'Hide' : 'Show'}
            </button>
          }
        />
      ))}

      <div className="flex items-center gap-2 mt-1">
        <svg className="text-text-faint shrink-0" width="13" height="13" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <p className="text-[12px] text-text-faint">
          Stored securely in your OS keychain — never written to the database.
        </p>
      </div>
    </div>
  );
}
