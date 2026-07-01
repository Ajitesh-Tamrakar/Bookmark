import SegmentedControl from '../primitives/SegmentedControl';

const OPTIONS = [
  { value: 'ollama', label: 'Ollama', sub: 'Recommended · fully local' },
  { value: 'openai', label: 'OpenAI', sub: 'Hosted · needs API key' },
  { value: 'custom', label: 'Customize', sub: 'Set each model' },
];

export default function ProviderToggle({ top, onSetTop }) {
  return <SegmentedControl variant="card" columns={3} options={OPTIONS} value={top} onChange={onSetTop} />;
}
