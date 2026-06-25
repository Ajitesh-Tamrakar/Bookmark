import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';

const GEN_MODELS = {
  ollama: ['gemma4:e2b', 'llama3.2:3b', 'qwen2.5:7b', 'mistral:7b'],
  openai: ['gpt-4o-mini', 'gpt-4o'],
  anthropic: ['claude-haiku-4', 'claude-sonnet-4'],
  google: ['gemini-2.0-flash', 'gemini-1.5-pro'],
};

const PROV_LABEL = { ollama: 'Ollama', openai: 'OpenAI', anthropic: 'Anthropic', google: 'Google' };

export default function GenerationSection({
  expanded,
  genProvider,
  genModel,
  onGenProvider,
  onGenModel,
  onCustomize,
}) {
  const models = GEN_MODELS[genProvider] || [];

  return (
    <div>
      {expanded ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium text-text-muted">Provider</label>
            <Select
              value={genProvider}
              onChange={(_, val) => val && onGenProvider(val)}
              size="sm"
            >
              <Option value="ollama">Ollama</Option>
              <Option value="openai">OpenAI</Option>
              <Option value="anthropic">Anthropic</Option>
              <Option value="google">Google</Option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium text-text-muted">Model</label>
            <Select
              value={genModel}
              onChange={(_, val) => val && onGenModel(val)}
              size="sm"
            >
              {models.map((m) => (
                <Option key={m} value={m}>
                  {m}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between py-[10px] px-4 rounded-[8px] border border-border-subtle bg-bg-sunken">
          <p className="text-[13px] font-medium text-text-primary">
            {PROV_LABEL[genProvider]} · {genModel}
          </p>
          <button
            type="button"
            onClick={onCustomize}
            className="text-[12px] text-text-faint hover:text-text-muted transition-colors cursor-pointer"
          >
            Customize →
          </button>
        </div>
      )}
    </div>
  );
}
