import SqlHint from './SqlHint';

const GRID = 'grid-cols-[1fr_88px_84px]';

const TYPE_CHIP_CLASSES = {
  video: 'text-accent-info border-accent-info/30 bg-accent-info/7',
  image: 'text-text-muted border-border-default bg-bg-raised',
  audio: 'text-accent-audio border-accent-audio/30 bg-accent-audio/7',
};

export default function TempFolderSection({ files }) {
  const counts = {};
  files.forEach((f) => { counts[f.type] = (counts[f.type] || 0) + 1; });
  const typeOrder = ['video', 'image', 'audio'];
  const present = typeOrder.filter((t) => counts[t]);
  const summary = `${files.length} files · ${present.map((t) => `${counts[t]} ${t}`).join(' · ')}`;

  return (
    <section id="temp" className="scroll-mt-14">
      <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-text-faint">
        Temp folder
      </div>
      <h2 className="text-[21px] font-semibold tracking-tight text-text-primary mt-[7px] mb-0">
        tmp/captures/ snapshot
      </h2>
      <p className="text-text-muted text-[13.5px] leading-relaxed mt-[6px]">
        Disk contents parsed from the {'{bookmark_id}_{content_type}.{ext}'} naming. Replay
        inventory — deliberately not joined against the bookmarks table.
      </p>
      <SqlHint>
        {`# filesystem read, no DB join\nls tmp/captures/  →  parse {bookmark_id}_{content_type}.{ext}`}
      </SqlHint>

      <div className="flex items-center justify-between gap-[14px] flex-wrap mb-3">
        <div className="font-mono text-[12.5px] text-text-muted">{summary}</div>
        <div className="flex gap-2">
          {present.map((t) => (
            <span
              key={t}
              className={`font-mono text-[10px] tracking-[0.04em] px-2 py-[2px] rounded-[5px] border ${TYPE_CHIP_CLASSES[t]}`}
            >
              {counts[t]} {t}
            </span>
          ))}
        </div>
      </div>

      <div className="border border-[#1f1e24] bg-[#0a090c] rounded-xl overflow-hidden">
        <div className={`grid ${GRID} items-center gap-[14px] px-4 py-[9px] border-b border-[#1f1e24] bg-[#0c0b0e]`}>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint">filename</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint">content_type</div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint text-right">size</div>
        </div>

        {files.map((f) => {
          const name = `${f.bid}_${f.type}.${f.ext}`;
          return (
            <div
              key={name}
              className={`grid ${GRID} items-center gap-[14px] px-4 py-[13px] border-b border-[#141318] last:border-b-0`}
            >
              <div className="font-mono text-[12px] text-[#cfcdd6] truncate">{name}</div>
              <div>
                <span
                  className={`font-mono text-[10px] tracking-[0.04em] px-2 py-[2px] rounded-[5px] border ${TYPE_CHIP_CLASSES[f.type] || TYPE_CHIP_CLASSES.image}`}
                >
                  {f.type}
                </span>
              </div>
              <div className="font-mono text-[11.5px] text-text-faint text-right">{f.size}</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-[9px] items-start mt-[13px]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-[2px]">
          <circle cx="12" cy="12" r="9" stroke="#46444d" strokeWidth="1.6" />
          <rect x="11.1" y="10.5" width="1.8" height="6" rx=".9" fill="#46444d" />
          <circle cx="12" cy="7.6" r="1.05" fill="#46444d" />
        </svg>
        <p className="text-[12px] text-text-faint leading-[1.55] m-0">
          After a dev-mode DB wipe these files are orphaned by design — that&apos;s the replay
          mechanism. Joining on bookmarks.id would hide exactly what this section exists to surface.
        </p>
      </div>
    </section>
  );
}
