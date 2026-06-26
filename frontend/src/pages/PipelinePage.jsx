import { useState, useEffect, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';

import PipelineNav from '../components/pipeline/PipelineNav';
import WorkerStatusBar from '../components/pipeline/WorkerStatusBar';
import SummarySection from '../components/pipeline/SummarySection';
import InFlightTable from '../components/pipeline/InFlightTable';
import PendingTable from '../components/pipeline/PendingTable';
import FailedTable from '../components/pipeline/FailedTable';
import TempFolderSection from '../components/pipeline/TempFolderSection';

const POLL_INTERVAL_SEC = 3;
const STALE_THRESHOLD_SEC = 90;

const NAV_ITEMS = [
  { id: 'summary', label: 'Summary' },
  { id: 'inflight', label: 'In-flight' },
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
  { id: 'temp', label: 'Temp folder' },
];

function fmtElapsed(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60), r = sec % 60;
  return `${m}m ${String(r).padStart(2, '0')}s`;
}

function fmtAgo(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 4) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// ---------------------------------------------------------------------------
// Dev-mode guard — redirects away if setup_status says dev_mode is false
// ---------------------------------------------------------------------------
function useDevModeGuard() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'allowed' | 'denied'

  useEffect(() => {
    fetch('/setup/status/')
      .then((res) => res.json())
      .then((data) => setStatus(data.dev_mode ? 'allowed' : 'denied'))
      .catch(() => setStatus('denied'));
  }, []);

  return status;
}

// ---------------------------------------------------------------------------
// PipelinePage
// ---------------------------------------------------------------------------
export default function PipelinePage() {
  const devGuard = useDevModeGuard();

  const [data, setData] = useState(null);
  const [clock, setClock] = useState(Date.now());
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [polling, setPolling] = useState(true);
  const [activeSection, setActiveSection] = useState('summary');

  const pollRef = useRef(null);

  useEffect(() => { document.title = 'Bookmark · Pipeline'; }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/pipeline/status/');
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
      setLastRefresh(Date.now());
    } catch {
      // network error — keep stale data, don't crash
    }
  };

  // 1-second clock tick (independent of polling)
  useEffect(() => {
    const iv = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  // initial fetch + poll
  useEffect(() => {
    if (devGuard !== 'allowed') return;
    fetchStatus();
  }, [devGuard]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (devGuard !== 'allowed') return;
    if (polling) {
      pollRef.current = setInterval(fetchStatus, POLL_INTERVAL_SEC * 1000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [polling, devGuard]); // eslint-disable-line react-hooks/exhaustive-deps

  // scroll-spy nav
  useEffect(() => {
    const observers = [];
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: '-42% 0px -52% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const handleRefresh = () => fetchStatus();

  const handleTogglePolling = () => setPolling((prev) => !prev);

  const handleRetry = async (id) => {
    try {
      await fetch(`/pipeline/retry/${id}/`, { method: 'POST' });
      fetchStatus();
    } catch {
      // best-effort
    }
  };

  // ---------------------------------------------------------------------------
  // Guard states
  // ---------------------------------------------------------------------------
  if (devGuard === 'loading' || (devGuard === 'allowed' && !data)) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-border-strong border-t-text-primary animate-spin" />
      </div>
    );
  }

  if (devGuard === 'denied') {
    return <Navigate to="/" replace />;
  }

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const procRows = data.processing.map((r) => {
    const startedAt = r.processing_started_at
      ? new Date(r.processing_started_at).getTime()
      : new Date(r.saved_at).getTime();
    return {
      ...r,
      stale: (clock - startedAt) > STALE_THRESHOLD_SEC * 1000,
      elapsed: fmtElapsed(clock - startedAt),
    };
  });

  const pendingRows = data.pending.map((r) => ({
    ...r,
    savedAgo: fmtAgo(clock - new Date(r.saved_at).getTime()),
  }));

  const summary = [
    { label: 'Pending', value: data.pending.length, dotKey: 'p', isError: false },
    { label: 'Processing', value: data.processing.length, dotKey: 'pr', isError: false },
    { label: 'Complete', value: data.complete_count.toLocaleString(), dotKey: 'c', isError: false },
    { label: 'Failed', value: data.failed.length, dotKey: 'f', isError: data.failed.length > 0 },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      className="min-h-screen bg-bg-base font-sans"
      style={{ WebkitFontSmoothing: 'antialiased' }}
    >
      <div className="max-w-[1200px] mx-auto px-8 pt-10 pb-40 box-border">
        {/* top bar */}
        <div className="flex items-center justify-between pb-6 border-b border-bg-sunken">
          <div className="flex items-center gap-[14px]">
            <span className="w-[30px] h-[30px] rounded-lg bg-text-primary flex items-center justify-center shrink-0 mr-1">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#0a0a0b">
                <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.7L5 21V4a1 1 0 0 1 1-1z" />
              </svg>
            </span>
            <span className="text-[15.5px] font-semibold tracking-tight text-text-primary">
              Bookmark
            </span>
            <span className="text-[#3a3842] text-[15px]">/</span>
            <span className="text-[15.5px] font-semibold tracking-tight text-text-primary">
              Pipeline
            </span>
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-accent-warning-text border border-accent-warning/35 bg-accent-warning/6 rounded-[5px] px-[7px] py-[2px] ml-[6px]">
              dev
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/search"
              className="group inline-flex items-center gap-2 bg-[#0e0d11] border border-border-default rounded-lg text-text-secondary font-mono text-[11.5px] tracking-[0.04em] px-3 py-[7px] no-underline transition-all hover:border-border-strong hover:text-text-primary hover:bg-[#15141a]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <circle cx="11" cy="11" r="6.4" stroke="currentColor" strokeWidth="1.7" />
                <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              Search
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                className="shrink-0 text-text-faint transition-all group-hover:text-text-secondary group-hover:translate-x-[2px]"
              >
                <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <span className="font-mono text-[11px] tracking-[0.04em] text-text-faint">
              internal · processing monitor
            </span>
          </div>
        </div>

        {/* layout */}
        <div className="flex gap-12 items-start mt-7">
          <PipelineNav items={NAV_ITEMS} activeSection={activeSection} />

          <div className="flex-1 min-w-0 flex flex-col gap-11">
            <WorkerStatusBar
              polling={polling}
              lastRefreshText={fmtAgo(clock - lastRefresh)}
              concurrency={1}
              pollIntervalSec={POLL_INTERVAL_SEC}
              onRefresh={handleRefresh}
              onTogglePolling={handleTogglePolling}
            />

            <SummarySection summary={summary} />

            <InFlightTable rows={procRows} count={data.processing.length} />

            <PendingTable rows={pendingRows} count={data.pending.length} />

            <FailedTable rows={data.failed} count={data.failed.length} onRetry={handleRetry} />

            <TempFolderSection files={data.temp_files} />
          </div>
        </div>
      </div>
    </div>
  );
}
