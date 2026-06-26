const PLATFORM = {
  youtube:   { label: 'yt',  cls: 'text-accent-youtube border-[rgba(224,114,107,0.32)] bg-[rgba(224,114,107,0.07)]' },
  linkedin:  { label: 'in',  cls: 'text-accent-linkedin border-[rgba(111,159,216,0.32)] bg-[rgba(111,159,216,0.07)]' },
  pinterest: { label: 'pin', cls: 'text-accent-pinterest border-[rgba(216,122,142,0.32)] bg-[rgba(216,122,142,0.07)]' },
  twitter:   { label: 'x',   cls: 'text-text-secondary border-border-default bg-bg-sunken' },
  web:       { label: 'web', cls: 'text-[#88998f] border-[rgba(136,153,143,0.32)] bg-[rgba(136,153,143,0.06)]' },
};

function fmtAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}${d === 1 ? ' day' : ' days'} ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}${w === 1 ? ' week' : ' weeks'} ago`;
  const mo = Math.round(d / 30);
  return `${mo}${mo === 1 ? ' month' : ' months'} ago`;
}

function fmtAbs(ts) {
  try { return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return ''; }
}

function fmtTs(sec) {
  const m = Math.floor(sec / 60);
  return `${m}:${String(sec % 60).padStart(2, '0')}`;
}

function getDomain(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

function openUrl(item) {
  if (item.platform === 'youtube' && item.timestamp_seconds != null) {
    const sep = item.url.includes('?') ? '&' : '?';
    return `${item.url}${sep}t=${item.timestamp_seconds}`;
  }
  return item.url;
}

export default function ResultCard({ item, showScore, onDelete, onPickTag }) {
  const plat = PLATFORM[item.platform] || PLATFORM.web;
  const isApprox = showScore && item.distance >= 0.35;
  const scoreNum = showScore ? Math.max(0, Math.round((1 - Math.min(item.distance, 1)) * 100)) : null;
  const showTs = item.platform === 'youtube' && item.timestamp_seconds != null && showScore;

  return (
    <div
      className="grid gap-4 items-start border border-border-subtle bg-bg-raised rounded-[13px] px-[18px] py-4 cursor-pointer transition-all hover:border-border-default hover:bg-[#0e0d11] group"
      style={{ gridTemplateColumns: 'auto 1fr auto' }}
      onClick={() => window.open(openUrl(item), '_blank', 'noopener,noreferrer')}
    >
      {/* Platform badge */}
      <div className="mt-[1px]">
        <span className={`font-mono text-[10px] tracking-[0.04em] px-[7px] py-[5px] rounded-[6px] border inline-flex items-center justify-center min-w-[34px] ${plat.cls}`}>
          {plat.label}
        </span>
      </div>

      {/* Main content */}
      <div className="min-w-0 flex flex-col gap-2">
        <div className="flex items-center gap-[9px] flex-wrap">
          <span className="text-[15px] font-medium text-text-primary tracking-tight leading-[1.3]">
            {item.title || getDomain(item.url)}
          </span>
          {isApprox && (
            <span className="font-mono text-[9.5px] tracking-[0.05em] text-accent-warning-text border border-[rgba(217,167,46,0.35)] bg-[rgba(217,167,46,0.06)] rounded-[5px] px-[7px] py-[2px]">
              approx
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-[11.5px] text-text-faint min-w-0 flex-wrap">
          <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[24em]">
            {item.author ? `${item.author} · ` : ''}{getDomain(item.url)}
          </span>
          <span className="text-border-strong">·</span>
          <span title={fmtAbs(item.saved_at)}>{fmtAgo(item.saved_at)}</span>
          {showTs && (
            <>
              <span className="text-border-strong">·</span>
              <span className="text-accent-info inline-flex items-center gap-1 whitespace-nowrap">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                jumps to {fmtTs(item.timestamp_seconds)}
              </span>
            </>
          )}
        </div>

        {item.tags?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-[1px]">
            {item.tags.map((tag) => (
              <span
                key={tag.name}
                onClick={(e) => { e.stopPropagation(); onPickTag(tag.name); }}
                className={[
                  'font-mono text-[10px] tracking-[0.03em] px-2 py-[3px] rounded-[5px] inline-flex items-center gap-[5px] border cursor-pointer transition-all',
                  tag.source === 'ai'
                    ? 'text-accent-tag-ai border-[rgba(169,154,223,0.26)] bg-[rgba(169,154,223,0.06)] hover:border-[rgba(169,154,223,0.5)]'
                    : 'text-text-muted border-border-default bg-bg-raised hover:border-border-strong hover:text-text-secondary',
                ].join(' ')}
              >
                {tag.source === 'ai' && (
                  <span className="w-[4px] h-[4px] rounded-full bg-accent-tag-ai flex-none" />
                )}
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Score / date + delete */}
      <div className="flex flex-col items-end gap-3 flex-none">
        {showScore ? (
          <div className="flex flex-col items-end gap-[5px]">
            <span className={`font-mono text-[13px] tabular-nums ${isApprox ? 'text-text-faint' : 'text-text-secondary'}`}>
              {scoreNum}%
            </span>
            <div className="w-[56px] h-[4px] bg-bg-sunken rounded-[3px] overflow-hidden">
              <div
                className={`h-full rounded-[3px] ${isApprox ? 'bg-border-strong' : 'bg-text-primary'}`}
                style={{ width: `${scoreNum}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="font-mono text-[11.5px] text-text-faint whitespace-nowrap" title={fmtAbs(item.saved_at)}>
            {fmtAgo(item.saved_at)}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(item.id, item.title); }}
          className="bg-transparent border border-border-default rounded-[7px] text-text-faint cursor-pointer p-[6px] flex opacity-0 group-hover:opacity-100 transition-all hover:border-[rgba(240,96,90,0.4)] hover:text-accent-error"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
