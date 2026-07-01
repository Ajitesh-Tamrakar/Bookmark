export default function SqlHint({ children }) {
  return (
    <pre className="my-[14px] px-[13px] py-[11px] bg-bg-panel-strong border border-border-hairline rounded-lg font-mono text-[11px] text-text-faint leading-[1.65] whitespace-pre-wrap overflow-x-auto">
      {children}
    </pre>
  );
}
