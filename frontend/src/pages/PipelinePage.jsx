import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';

import PipelineNav from '../components/pipeline/PipelineNav';
import WorkerStatusBar from '../components/pipeline/WorkerStatusBar';
import SummarySection from '../components/pipeline/SummarySection';
import InFlightTable from '../components/pipeline/InFlightTable';
import PendingTable from '../components/pipeline/PendingTable';
import FailedTable from '../components/pipeline/FailedTable';
import TempFolderSection from '../components/pipeline/TempFolderSection';

import { seedPipelineRows, advancePipelineRows } from '../mock/pipelineMockData';

const POLL_INTERVAL_SEC = 3;
const CONCURRENCY = 3;
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
      .then((data) => {
        setStatus(data.dev_mode ? 'allowed' : 'denied');
      })
      .catch(() => setStatus('denied'));
  }, []);

  return status;
}

// ---------------------------------------------------------------------------
// PipelinePage
// ---------------------------------------------------------------------------
export default function PipelinePage() {
  const devGuard = useDevModeGuard();

  const seed = seedPipelineRows();
  const [rows, setRows] = useState(seed.rows);
  const [completeCount, setCompleteCount] = useState(seed.completeCount);
  const [tempFiles] = useState(seed.tempFiles);
  const [incomingIdx, setIncomingIdx] = useState(seed.incomingIdx);

  const [clock, setClock] = useState(Date.now());
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [polling, setPolling] = useState(true);
  const [activeSection, setActiveSection] = useState('summary');

  const pollRef = useRef(null);
  const clockRef = useRef(null);

  // 1-second clock tick (independent of polling)
  useEffect(() => {
    clockRef.current = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(clockRef.current);
  }, []);

  // poll tick
  const runPoll = () => {
    setRows((prevRows) => {
      const prevComplete = completeCount;
      const result = advancePipelineRows(prevRows, prevComplete, incomingIdx, CONCURRENCY);
      setCompleteCount(result.completeCount);
      setIncomingIdx(result.incomingIdx);
      setLastRefresh(Date.now());
      return result.rows;
    });
  };

  useEffect(() => {
    if (polling) {
      pollRef.current = setInterval(runPoll, POLL_INTERVAL_SEC * 1000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [polling]); // eslint-disable-line react-hooks/exhaustive-deps

  // scroll-spy nav (same IntersectionObserver pattern as SetupPage)
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

  // handlers
  const handleRefresh = () => runPoll();

  const handleTogglePolling = () => {
    setPolling((prev) => !prev);
  };

  // TODO(backend): replace with real restart endpoint call
  const handleRestart = () => {
    const now = Date.now();
    setRows((prev) =>
      prev.map((r) =>
        r.processing_status === 'processing'
          ? { ...r, processing_status: 'pending', current_step: null, processing_started_at: null, saved_at: r.saved_at || now }
          : r
      )
    );
    setLastRefresh(now);
  };

  // TODO(backend): replace with real retry endpoint call
  const handleRetry = (id) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, processing_status: 'pending', retry_count: 0, failed_at: null, processing_error: null, current_step: null, saved_at: Date.now() }
          : r
      )
    );
  };

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const procRows = rows.filter((r) => r.processing_status === 'processing');
  const pendRows = rows.filter((r) => r.processing_status === 'pending').sort((a, b) => a.saved_at - b.saved_at);
  const failRows = rows.filter((r) => r.processing_status === 'failed');

  const summary = [
    { label: 'Pending', value: pendRows.length, dotKey: 'p', isError: false },
    { label: 'Processing', value: procRows.length, dotKey: 'pr', isError: false },
    { label: 'Complete', value: completeCount.toLocaleString(), dotKey: 'c', isError: false },
    { label: 'Failed', value: failRows.length, dotKey: 'f', isError: failRows.length > 0 },
  ];

  const inflightRows = procRows
    .slice()
    .sort((a, b) => a.processing_started_at - b.processing_started_at)
    .map((r) => ({
      ...r,
      stale: (clock - r.processing_started_at) > STALE_THRESHOLD_SEC * 1000,
      elapsed: fmtElapsed(clock - r.processing_started_at),
    }));

  const pendingRows = pendRows.map((r) => ({
    ...r,
    savedAgo: fmtAgo(clock - r.saved_at),
  }));

  // ---------------------------------------------------------------------------
  // Guard states
  // ---------------------------------------------------------------------------
  if (devGuard === 'loading') {
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
          <div className="font-mono text-[11px] tracking-[0.04em] text-text-faint">
            internal · processing monitor
          </div>
        </div>

        {/* layout */}
        <div className="flex gap-12 items-start mt-7">
          <PipelineNav items={NAV_ITEMS} activeSection={activeSection} />

          <div className="flex-1 min-w-0 flex flex-col gap-11">
            <WorkerStatusBar
              polling={polling}
              lastRefreshText={fmtAgo(clock - lastRefresh)}
              concurrency={CONCURRENCY}
              pollIntervalSec={POLL_INTERVAL_SEC}
              onRefresh={handleRefresh}
              onTogglePolling={handleTogglePolling}
              onRestart={handleRestart}
            />

            <SummarySection summary={summary} />

            <InFlightTable rows={inflightRows} count={procRows.length} />

            <PendingTable rows={pendingRows} count={pendRows.length} />

            <FailedTable rows={failRows} count={failRows.length} onRetry={handleRetry} />

            <TempFolderSection files={tempFiles} />
          </div>
        </div>
      </div>
    </div>
  );
}
