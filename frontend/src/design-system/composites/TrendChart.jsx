import { useState } from 'react';
import { fmtPct, shortDateMD, shortModel, clamp } from '../retrievalUtils';

const CHART_W = 800;
const CHART_H = 200;
const PLOT_TOP = 10;
const PLOT_H = 150;

function yFor(v) {
  return PLOT_TOP + (1 - v) * PLOT_H;
}

export default function TrendChart({ runs }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const xStep = runs.length > 1 ? CHART_W / (runs.length - 1) : 0;
  const points = runs.map((r, i) => {
    const x = i * xStep;
    return {
      x,
      y1: yFor(r.recall_at_1),
      y5: yFor(r.recall_at_5),
      yM: yFor(r.mrr),
      dateShort: shortDateMD(r.run_at),
      hitX: Math.max(0, x - xStep / 2),
      hitW: xStep || CHART_W,
      run: r,
    };
  });

  const toPolyline = (key) => points.map((p) => `${p.x.toFixed(1)},${p[key].toFixed(1)}`).join(' ');

  const hovered = hoverIdx != null ? points[hoverIdx] : null;
  const tooltipLeft = hovered ? clamp(hovered.x - 100, 0, CHART_W - 210) : 0;

  return (
    <div>
      <div className="flex items-center gap-5 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-accent-info)' }} />
          <span className="font-mono text-text-muted text-[11px]">Recall@1</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-accent-success)' }} />
          <span className="font-mono text-text-muted text-[11px]">Recall@5</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-accent-tag-ai)' }} />
          <span className="font-mono text-text-muted text-[11px]">MRR</span>
        </div>
      </div>
      <div className="relative">
        <svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-auto block">
          <polyline points={toPolyline('y1')} fill="none" stroke="var(--color-accent-info)" strokeWidth="2" />
          <polyline points={toPolyline('y5')} fill="none" stroke="var(--color-accent-success)" strokeWidth="2" />
          <polyline points={toPolyline('yM')} fill="none" stroke="var(--color-accent-tag-ai)" strokeWidth="2" />
          {points.map((p, i) => {
            const r = i === hoverIdx ? 5 : 3;
            return (
              <g key={p.run.id}>
                <circle cx={p.x} cy={p.y1} r={r} fill="var(--color-accent-info)" />
                <circle cx={p.x} cy={p.y5} r={r} fill="var(--color-accent-success)" />
                <circle cx={p.x} cy={p.yM} r={r} fill="var(--color-accent-tag-ai)" />
                <text
                  x={p.x}
                  y={192}
                  textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9.5px', fill: 'var(--color-text-faint)' }}
                >
                  {p.dateShort}
                </text>
                <rect
                  x={p.hitX}
                  y={0}
                  width={p.hitW}
                  height={176}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                />
              </g>
            );
          })}
        </svg>
        {hovered && (
          <div
            className="absolute min-w-[190px] bg-bg-raised border border-border-default rounded-[10px] px-3 py-[10px] pointer-events-none z-10"
            style={{ left: tooltipLeft, top: 4 }}
          >
            <div className="font-mono text-text-faint text-[10.5px] mb-1.5">{hovered.run.run_at.slice(0, 10)}</div>
            <div className="text-text-secondary text-[12px] flex flex-col gap-[3px]">
              <div>Recall@1 <span className="text-text-primary font-medium">{fmtPct(hovered.run.recall_at_1)}</span></div>
              <div>Recall@5 <span className="text-text-primary font-medium">{fmtPct(hovered.run.recall_at_5)}</span></div>
              <div>MRR <span className="text-text-primary font-medium">{hovered.run.mrr.toFixed(2)}</span></div>
            </div>
            <div className="font-mono text-text-faint text-[10.5px] border-t border-border-faint mt-2 pt-2 flex flex-col gap-[2px]">
              <div>{shortModel(hovered.run.embedding_model)}</div>
              <div>
                chunk {hovered.run.chunk_size ?? '—'} · prefix {hovered.run.prefix_enabled ? 'on' : 'off'} · hybrid{' '}
                {hovered.run.hybrid_enabled ? 'on' : 'off'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
