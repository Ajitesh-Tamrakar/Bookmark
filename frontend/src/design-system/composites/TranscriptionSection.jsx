import SegmentedControl from '../primitives/SegmentedControl';

const SIZES = ['tiny', 'base', 'small', 'medium', 'large'];
const OPTIONS = SIZES.map((s) => ({ value: s, label: s }));

export default function TranscriptionSection({ whisper, onSetWhisper }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between text-[11px] text-text-faint font-mono">
        <span>← Faster</span>
        <span>More accurate →</span>
      </div>
      <SegmentedControl variant="simple" options={OPTIONS} value={whisper} onChange={onSetWhisper} />
    </div>
  );
}
