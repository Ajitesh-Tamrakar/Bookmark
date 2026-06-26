export default function ResultsHeader({ label, sub }) {
  if (!label) return null;
  return (
    <div className="flex items-baseline gap-[11px] mt-8 mb-4 flex-wrap">
      <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-text-primary">
        {label}
      </span>
      <span className="font-mono text-[12px] text-text-faint">{sub}</span>
    </div>
  );
}
