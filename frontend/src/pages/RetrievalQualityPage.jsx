import { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';

import useDevModeGuard from '../hooks/useDevModeGuard';
import {
  Badge,
  RetrievalNav,
  OverviewSection,
  TrendSection,
  BreakdownSection,
  EvalRunsSection,
  GoldenSetSection,
  FeedbackSection,
} from '../design-system';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'trend', label: 'Trend' },
  { id: 'breakdown', label: 'Breakdown' },
  { id: 'runs', label: 'Eval runs' },
  { id: 'goldenset', label: 'Golden set' },
  { id: 'feedback', label: 'Feedback' },
];

const EMPTY_GOLDEN_SET = { fingerprint: '', entry_count: 0, last_updated: null };
const EMPTY_FEEDBACK = { total_searches: 0, yes_pct: 0, no_pct: 0, rows: [] };

export default function RetrievalQualityPage() {
  const devGuard = useDevModeGuard();

  const [runs, setRuns] = useState([]);
  const [activeGoldenSet, setActiveGoldenSet] = useState(EMPTY_GOLDEN_SET);
  const [feedback, setFeedback] = useState(EMPTY_FEEDBACK);
  const [queryCache, setQueryCache] = useState({}); // runId -> queries[] | 'loading' | 'error'
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => { document.title = 'Internet Expedition · Retrieval Quality'; }, []);

  const fetchRuns = useCallback(() => {
    fetch('/evaluate/runs/')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => setRuns(json.runs))
      .catch(() => {
        // network/403 — keep stale data, don't crash
      });
  }, []);

  const fetchActiveGoldenSet = useCallback(() => {
    fetch('/evaluate/golden-set/active/')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => setActiveGoldenSet(json))
      .catch(() => {});
  }, []);

  const fetchFeedback = useCallback(() => {
    fetch('/evaluate/feedback/')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => setFeedback(json))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (devGuard !== 'allowed') return;
    fetchRuns();
    fetchActiveGoldenSet();
    fetchFeedback();
  }, [devGuard, fetchRuns, fetchActiveGoldenSet, fetchFeedback]);

  const queryFetchState = useRef({}); // runId -> 'loading' | 'done' | 'error', synchronous dedup guard

  const fetchQueriesForRun = useCallback((runId) => {
    if (queryFetchState.current[runId]) return;
    queryFetchState.current[runId] = 'loading';
    setQueryCache((prev) => ({ ...prev, [runId]: 'loading' }));

    fetch(`/evaluate/runs/${runId}/queries/`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => {
        queryFetchState.current[runId] = 'done';
        setQueryCache((prev) => ({ ...prev, [runId]: json.queries }));
      })
      .catch(() => {
        queryFetchState.current[runId] = 'error';
        setQueryCache((prev) => ({ ...prev, [runId]: 'error' }));
      });
  }, []);

  const handleFeedbackResolved = (id) => {
    setFeedback((prev) => ({ ...prev, rows: prev.rows.filter((r) => r.id !== id) }));
  };

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
    <div className="min-h-screen bg-bg-base font-sans" style={{ WebkitFontSmoothing: 'antialiased' }}>
      <div className="max-w-[1200px] mx-auto px-8 pt-10 pb-40 box-border">
        {/* top bar */}
        <div className="flex items-center justify-between pb-6 border-b border-bg-sunken">
          <div className="flex items-center gap-[14px]">
            <span className="w-[30px] h-[30px] rounded-lg bg-text-primary flex items-center justify-center shrink-0 mr-1">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#0a0a0b">
                <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.7L5 21V4a1 1 0 0 1 1-1z" />
              </svg>
            </span>
            <span className="text-[15.5px] font-semibold tracking-tight text-text-primary">Internet Expedition</span>
            <span className="text-border-strong text-[15px]">/</span>
            <span className="text-[15.5px] font-semibold tracking-tight text-text-primary">Retrieval Quality</span>
            <Badge tone="warning" size="xs" className="ml-[6px] uppercase">dev</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/pipeline"
              className="inline-flex items-center gap-2 bg-bg-hover border border-border-default rounded-lg text-text-secondary font-mono text-[11.5px] tracking-[0.04em] px-3 py-[7px] no-underline transition-all hover:border-border-strong hover:text-text-primary hover:bg-bg-hover-strong"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M11 19l-7-7 7-7M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Pipeline
            </Link>
            <span className="font-mono text-[11px] tracking-[0.04em] text-text-faint">
              internal · retrieval quality
            </span>
          </div>
        </div>

        {/* layout */}
        <div className="flex gap-12 items-start mt-7">
          <RetrievalNav items={NAV_ITEMS} activeSection={activeSection} />

          <div className="flex-1 min-w-0 flex flex-col gap-11">
            <OverviewSection runs={runs} />

            <TrendSection runs={runs} />

            <BreakdownSection runs={runs} queryCache={queryCache} onFetchQueries={fetchQueriesForRun} />

            <EvalRunsSection runs={runs} queryCache={queryCache} onFetchQueries={fetchQueriesForRun} />

            <GoldenSetSection activeGoldenSet={activeGoldenSet} onConfirmed={fetchActiveGoldenSet} />

            <FeedbackSection feedback={feedback} onRowResolved={handleFeedbackResolved} />
          </div>
        </div>
      </div>
    </div>
  );
}
