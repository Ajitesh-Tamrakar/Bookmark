import Select from '../primitives/Select';
import Card from '../primitives/Card';

const PROV_LABEL = { ollama: 'Ollama', openai: 'OpenAI', anthropic: 'Anthropic', google: 'Google' };

// registry: { [provider]: string[] }, fetched from GET /setup/models/ so adding a
// model/provider is a backend-only (core/registry.py) edit.
export default function GenerationSection({
  expanded,
  genProvider,
  genModel,
  registry,
  onGenProvider,
  onGenModel,
  onCustomize,
}) {
  const models = registry?.[genProvider] || [];
  const providerOptions = Object.keys(registry || PROV_LABEL).map((v) => ({
    value: v,
    label: PROV_LABEL[v] || v,
  }));

  return (
    <div>
      {expanded ? (
        <div className="grid grid-cols-2 gap-4">
          <Select label="Provider" value={genProvider} onChange={(e) => onGenProvider(e.target.value)} options={providerOptions} />
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
