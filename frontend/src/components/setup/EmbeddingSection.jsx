import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';

const EMBED_MODELS = {
  ollama: [
    { value: 'nomic-embed-text-v2-moe', label: 'nomic-embed-text-v2-moe', dims: 768 },
    { value: 'mxbai-embed-large', label: 'mxbai-embed-large', dims: 1024 },
    { value: 'all-minilm', label: 'all-minilm', dims: 384 },
  ],
  openai: [
    { value: 'text-embedding-3-small', label: 'text-embedding-3-small', dims: 1536 },
    { value: 'text-embedding-3-large', label: 'text-embedding-3-large', dims: 3072 },
  ],
  google: [
    { value: 'text-embedding-004', label: 'text-embedding-004', dims: 768 },
  ],
};

const PROV_LABEL = { ollama: 'Ollama', openai: 'OpenAI', google: 'Google' };

export default function EmbeddingSection({
  expanded,
  embedProvider,
  embedModel,
  onEmbedProvider,
  onEmbedModel,
  onCustomize,
  onToggleExpanded,
}) {
  const models = EMBED_MODELS[embedProvider] || [];
  const currentModel = models.find((m) => m.value === embedModel);
  const dims = currentModel?.dims;

  return (
    <div className="flex flex-col gap-4">
      {/* Amber warning callout — always rendered first */}
      <div className="rounded-[10px] border border-accent-warning/30 bg-accent-warning/[0.07] px-4 py-[14px] flex gap-3">
        <svg
          className="shrink-0 mt-[1px] text-accent-warning"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M8 1.5L1.5 13h13L8 1.5z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
        </svg>
        <div>
          <p className="text-[13px] font-semibold text-accent-warning-text mb-[4px]">
            This choice is permanent
          </p>
          <p className="text-[13px] text-text-muted leading-relaxed">
            Once you save your first bookmark, the embedding model is locked. Switching later
            means losing semantic search on everything you&apos;ve already saved — including
            paywalled content that can&apos;t be re-scraped. Choose carefully.
          </p>
        </div>
      </div>

      {expanded ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium text-text-muted">Provider</label>
            <Select
              value={embedProvider}
              onChange={(_, val) => val && onEmbedProvider(val)}
              size="sm"
            >
              <Option value="ollama">Ollama</Option>
              <Option value="openai">OpenAI</Option>
              <Option value="google">Google</Option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium text-text-muted">Model</label>
            <Select
              value={embedModel}
              onChange={(_, val) => val && onEmbedModel(val)}
              size="sm"
            >
              {models.map((m) => (
                <Option key={m.value} value={m.value}>
                  {m.label}
                </Option>
              ))}
            </Select>
            {dims && (
              <p className="text-[12px] text-text-faint">{dims}d vector space</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between py-[10px] px-4 rounded-[8px] border border-border-subtle bg-bg-sunken">
          <div>
            <p className="text-[13px] font-medium text-text-primary">
              {PROV_LABEL[embedProvider]} · {embedModel}
            </p>
            {dims && (
              <p className="text-[12px] text-text-faint mt-[2px]">{dims}d vector space</p>
            )}
          </div>
          <button
            type="button"
            onClick={onCustomize || onToggleExpanded}
            className="text-[12px] text-text-faint hover:text-text-muted transition-colors cursor-pointer"
          >
            Customize →
          </button>
        </div>
      )}
    </div>
  );
}
