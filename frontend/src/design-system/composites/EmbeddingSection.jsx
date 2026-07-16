import Select from '../primitives/Select';
import Callout from '../primitives/Callout';
import Card from '../primitives/Card';

const PROV_LABEL = { ollama: 'Ollama', openai: 'OpenAI', google: 'Google' };

// registry: { [provider]: { [model]: dims } }, fetched from GET /setup/models/
// so adding a model/provider is a backend-only (core/registry.py) edit.
function modelsFor(registry, provider) {
  const models = registry?.[provider] || {};
  return Object.entries(models).map(([value, dims]) => ({ value, label: value, dims }));
}

const WarningIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.5L1.5 13h13L8 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
  </svg>
);

export default function EmbeddingSection({
  expanded,
  embedProvider,
  embedModel,
  registry,
  onEmbedProvider,
  onEmbedModel,
  onCustomize,
  onToggleExpanded,
}) {
  const models = modelsFor(registry, embedProvider);
  const currentModel = models.find((m) => m.value === embedModel);
  const dims = currentModel?.dims;
  const providerOptions = Object.keys(registry || PROV_LABEL).map((v) => ({
    value: v,
    label: PROV_LABEL[v] || v,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Callout tone="warning" icon={WarningIcon} title="This choice is permanent">
        Once you save your first bookmark, the embedding model is locked. Switching later means
        losing semantic search on everything you&apos;ve already saved — including paywalled
        content that can&apos;t be re-scraped. Choose carefully.
      </Callout>

      {expanded ? (
        <div className="flex flex-col gap-4">
          <Select label="Provider" value={embedProvider} onChange={(e) => onEmbedProvider(e.target.value)} options={providerOptions} />
          <div className="flex flex-col gap-2">
            <Select
              label="Model"
              value={embedModel}
              onChange={(e) => onEmbedModel(e.target.value)}
              options={models.map((m) => ({ value: m.value, label: m.label }))}
            />
            {dims && <p className="text-[12px] text-text-faint">{dims}d vector space</p>}
          </div>
        </div>
      ) : (
        <Card variant="sunken" className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-text-primary">
              {PROV_LABEL[embedProvider]} · {embedModel}
            </p>
            {dims && <p className="text-[12px] text-text-faint mt-[2px]">{dims}d vector space</p>}
          </div>
          <button
            type="button"
            onClick={onCustomize || onToggleExpanded}
            className="text-[12px] text-text-faint hover:text-text-muted transition-colors cursor-pointer"
          >
            Customize →
          </button>
        </Card>
      )}
    </div>
  );
}
