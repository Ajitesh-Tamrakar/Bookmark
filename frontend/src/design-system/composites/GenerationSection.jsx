import Select from '../primitives/Select';
import Card from '../primitives/Card';

const GEN_MODELS = {
  ollama: ['gemma4:e2b', 'llama3.2:3b', 'qwen2.5:7b', 'mistral:7b'],
  openai: ['gpt-4o-mini', 'gpt-4o'],
  anthropic: ['claude-haiku-4', 'claude-sonnet-4'],
  google: ['gemini-2.0-flash', 'gemini-1.5-pro'],
};

const PROV_LABEL = { ollama: 'Ollama', openai: 'OpenAI', anthropic: 'Anthropic', google: 'Google' };
const PROVIDER_OPTIONS = Object.keys(PROV_LABEL).map((v) => ({ value: v, label: PROV_LABEL[v] }));

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
          <Select label="Provider" value={genProvider} onChange={(e) => onGenProvider(e.target.value)} options={PROVIDER_OPTIONS} />
          <Select
            label="Model"
            value={genModel}
            onChange={(e) => onGenModel(e.target.value)}
            options={models.map((m) => ({ value: m, label: m }))}
          />
        </div>
      ) : (
        <Card variant="sunken" className="flex items-center justify-between">
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
        </Card>
      )}
    </div>
  );
}
