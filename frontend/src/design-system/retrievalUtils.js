export const BUCKET_LABELS = { exact_name: 'Exact name', paraphrase: 'Paraphrase', vague: 'Vague' };
export const BUCKET_ORDER = ['exact_name', 'paraphrase', 'vague'];

export function fmtPct(v) {
  return Math.round(v * 100) + '%';
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function shortDate(iso) {
  return iso ? iso.slice(0, 10) : '—';
}

export function shortDateMD(iso) {
  const parts = shortDate(iso).split('-');
  return parts.length === 3 ? `${parts[1]}/${parts[2]}` : shortDate(iso);
}

export function shortModel(m) {
  return m ? m.replace('text-embedding-', '') : '—';
}

export function shortHash(fingerprint) {
  return fingerprint ? fingerprint.slice(0, 7) : '—';
}

export function deltaClass(v) {
  if (v == null) return 'text-text-faint';
  if (v > 0) return 'text-accent-success';
  if (v < 0) return 'text-accent-error';
  return 'text-text-faint';
}

export function pctDeltaText(v) {
  if (v == null) return '— no prior run';
  return (v >= 0 ? '▲ +' : '▼ ') + Math.abs(Math.round(v * 1000) / 10) + 'pt';
}

export function decDeltaText(v) {
  if (v == null) return '— no prior run';
  return (v >= 0 ? '▲ +' : '▼ ') + Math.abs(v).toFixed(2);
}

export function buildSpark(values, w, h) {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = (max - min) || 1;
  return values
    .map((v, i) => {
      const x = values.length > 1 ? (i / (values.length - 1)) * w : w / 2;
      const y = h - 2 - ((v - min) / range) * (h - 4);
      return x.toFixed(1) + ',' + y.toFixed(1);
    })
    .join(' ');
}

export function buildConfigBadges(run) {
  return [
    { label: shortModel(run.embedding_model), tone: 'neutral' },
    { label: run.chunk_size != null ? `chunk ${run.chunk_size}` : 'chunk —', tone: 'neutral' },
    { label: run.prefix_enabled ? 'prefix on' : 'prefix off', tone: run.prefix_enabled ? 'success' : 'muted' },
    { label: run.hybrid_enabled ? 'hybrid on' : 'hybrid off', tone: run.hybrid_enabled ? 'success' : 'muted' },
  ];
}

export function rankBadge(found_rank) {
  if (found_rank === null || found_rank === undefined) {
    return { text: 'not found', tone: 'error' };
  }
  if (found_rank === 1) return { text: `#${found_rank}`, tone: 'success' };
  if (found_rank <= 5) return { text: `#${found_rank}`, tone: 'neutral' };
  return { text: `#${found_rank}`, tone: 'warning' };
}

export function aggregateBuckets(queries) {
  const present = new Set(queries.map((q) => q.bucket));
  const keys = [...BUCKET_ORDER.filter((k) => present.has(k)), ...[...present].filter((k) => !BUCKET_ORDER.includes(k))];
  return keys.map((key) => {
    const qs = queries.filter((q) => q.bucket === key);
    const n = qs.length;
    const recall1 = n ? qs.filter((q) => q.found_rank === 1).length / n : 0;
    const recall5 = n ? qs.filter((q) => q.found_rank != null && q.found_rank <= 5).length / n : 0;
    return { key, label: BUCKET_LABELS[key] || key, recall1, recall5, count: n };
  });
}
