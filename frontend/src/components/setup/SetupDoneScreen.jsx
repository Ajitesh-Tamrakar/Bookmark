import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Row({ label, value, badge }) {
  return (
    <div className="flex items-center justify-between py-[11px] border-b border-border-subtle last:border-0">
      <span className="text-[13px] text-text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-text-primary font-mono">{value}</span>
        {badge && (
          <span className="text-[10px] font-semibold tracking-wide uppercase text-accent-warning bg-accent-warning/[0.12] border border-accent-warning/30 px-[6px] py-[2px] rounded-[4px]">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SetupDoneScreen({ embedModel, genModel, whisper, devMode }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown === 0) {
      navigate('/search', { replace: true });
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-8 py-[72px]">
      <div className="w-full max-w-[440px] flex flex-col items-center gap-6 animate-fade-up">
        {/* Green check icon */}
        <div className="w-[56px] h-[56px] rounded-full border-2 border-accent-success/40 bg-accent-success/[0.08] flex items-center justify-center">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" className="text-accent-success">
            <path
              d="M6 13.5l5 5 9-9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-[28px] font-semibold text-text-primary tracking-tight mb-2">
            Setup complete
          </h1>
          <p className="text-[14px] text-text-muted">
            Your bookmark engine is ready. Start saving links.
          </p>
        </div>

        {/* Summary table */}
        <div className="w-full rounded-[12px] border border-border-default bg-bg-raised px-5">
          <Row label="Embedding" value={embedModel} badge="LOCKED" />
          <Row label="Generation" value={genModel} />
          <Row label="Transcription" value={`whisper-${whisper}`} />
          <Row label="Dev mode" value={devMode ? 'on' : 'off'} />
        </div>

        <button
          type="button"
          onClick={() => navigate('/search', { replace: true })}
          className="w-full py-[12px] rounded-[10px] bg-text-primary text-bg-base text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          Continue → <span className="opacity-40 font-normal text-[13px]">{countdown}s</span>
        </button>
      </div>
    </div>
  );
}
