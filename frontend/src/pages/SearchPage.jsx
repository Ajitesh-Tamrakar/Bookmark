import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  SearchInput,
  TagRail,
  ResultsHeader,
  FallbackBanner,
  ResultCard,
  EmptyState,
  DeleteConfirmModal,
  Badge,
  Callout,
} from '../design-system';
import { redirectIfSetupRequired } from '../utils/setupGuard';

// Cosine distance thresholds (0 = identical, 1 = orthogonal).
// NORMAL: good semantic match. BROAD: looser, shown in approx mode.
const NORMAL_THRESHOLD = 0.35;
const BROAD_THRESHOLD = 0.65;

export default function SearchPage() {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  // multiTagLogic is an open product decision; defaulting to 'and'
  const [multiTagLogic] = useState('and');
  const [confirm, setConfirm] = useState(null); // { id, title }
  const [deepSearch, setDeepSearch] = useState(false);

  const [allTags, setAllTags] = useState([]);
  const [results, setResults] = useState({ mode: null, items: [] });
  const [showPipeline, setShowPipeline] = useState(false);
  const [unembeddedCount, setUnembeddedCount] = useState(0);

  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { document.title = 'Internet Expedition · Search'; }, []);

  // Fetch tags list and pipeline visibility on mount
  useEffect(() => {
    fetch('/retrieve/tags/')
      .then(async (r) => {
        const d = await r.json();
        if (redirectIfSetupRequired(r, d, navigate)) return;
        setAllTags(d.tags || []);
      })
      .catch(() => {});

    fetch('/setup/status/')
      .then((r) => r.json())
      .then((d) => setShowPipeline(!!(d.dev_mode && d.setup_complete)))
      .catch(() => {});

    fetch('/retrieve/status/summary/')
      .then((r) => r.json())
      .then((d) => setUnembeddedCount(d.unembedded_complete_count || 0))
      .catch(() => {});
  }, [navigate]);

  // ---------------------------------------------------------------------------
  // API calls — each mode hits its own endpoint, no client-side ranking
  // ---------------------------------------------------------------------------
  async function fetchRecent() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/retrieve/bookmarks/');
      const data = await res.json();
      if (!res.ok) {
        if (redirectIfSetupRequired(res, data, navigate)) return;
        throw new Error(data.message || `Server error ${res.status}`);
      }
      setResults({ mode: 'recent', items: data.results || [] });
    } catch (e) {
      setError(e.message);
      setResults({ mode: null, items: [] });
    } finally {
      setLoading(false);
    }
  }

  async function fetchBrowse(tagList) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ tags: tagList.join(','), logic: multiTagLogic });
      const res = await fetch(`/retrieve/bookmarks/?${params}`);
      const data = await res.json();
      if (!res.ok) {
        if (redirectIfSetupRequired(res, data, navigate)) return;
        throw new Error(data.message || `Server error ${res.status}`);
      }
      setResults({ mode: 'browse', items: data.results || [] });
    } catch (e) {
      setError(e.message);
      setResults({ mode: null, items: [] });
    } finally {
      setLoading(false);
    }
  }

  async function fetchSearch(q, tagList, deep = false) {
    setLoading(true);
    setError(null);
    setDeepSearch(deep);
    try {
      const params = new URLSearchParams({ q });
      if (tagList.length) {
        params.set('tags', tagList.join(','));
        params.set('logic', multiTagLogic);
      }
      if (deep) params.set('deep', '1');
      const res = await fetch(`/retrieve/search/?${params}`);
      const data = await res.json();
      if (!res.ok) {
        if (redirectIfSetupRequired(res, data, navigate)) return;
        throw new Error(data.message || `Server error ${res.status}`);
      }

      const items = data.results || [];
      const normal = items.filter((r) => r.distance < NORMAL_THRESHOLD);
      const approx = items.filter((r) => r.distance >= NORMAL_THRESHOLD && r.distance < BROAD_THRESHOLD);

      if (normal.length > 0) {
        setResults({ mode: 'search-normal', items: normal });
      } else if (approx.length > 0) {
        setResults({ mode: 'search-approx', items: approx.slice(0, 8) });
      } else {
        setResults({ mode: 'search-nomatch', items: [] });
      }
    } catch (e) {
      setError(e.message);
      setResults({ mode: null, items: [] });
    } finally {
      setLoading(false);
    }
  }

  // Re-fetch whenever query or selected tags change
  useEffect(() => {
    if (query === '' && selectedTags.length === 0) {
      fetchRecent();
    } else if (query === '' && selectedTags.length > 0) {
      fetchBrowse(selectedTags);
    } else {
      fetchSearch(query, selectedTags);
    }
  }, [query, selectedTags]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // ---------------------------------------------------------------------------
  // Input handlers
  // ---------------------------------------------------------------------------
  function handleInput(e) {
    const val = e.target.value;
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setQuery('');
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => setQuery(val.trim()), 500);
  }

  function handleClear() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInputValue('');
    setQuery('');
  }

  function handleDeepSearch() {
    fetchSearch(query, selectedTags, true);
  }

  // ---------------------------------------------------------------------------
  // Tag handlers
  // ---------------------------------------------------------------------------
  function toggleTag(name) {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  }

  function pickTag(name) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInputValue('');
    setQuery('');
    setSelectedTags([name]);
  }

  function clearAllTags() {
    setSelectedTags([]);
  }

  // ---------------------------------------------------------------------------
  // Delete handlers
  // ---------------------------------------------------------------------------
  async function handleConfirmDelete() {
    if (!confirm) return;
    const { id } = confirm;
    setConfirm(null);
    try {
      const res = await fetch(`/retrieve/bookmarks/${id}/`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        if (redirectIfSetupRequired(res, data, navigate)) return;
        throw new Error(data.message || `Server error ${res.status}`);
      }
      setResults((prev) => ({ ...prev, items: prev.items.filter((r) => r.id !== id) }));
      // Refresh tag counts after deletion
      fetch('/retrieve/tags/')
        .then((r) => r.json())
        .then((d) => setAllTags(d.tags || []))
        .catch(() => {});
    } catch (e) {
      setError(`Delete failed: ${e.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Derived display values
  // ---------------------------------------------------------------------------
  const { mode, items } = results;
  const hasTags = selectedTags.length > 0;
  const tagPhrase = selectedTags.join(multiTagLogic === 'and' ? ' + ' : ' / ');
  const qShow = `"${query}"`;

  let headLabel = '';
  let headSub = '';
  let showFallback = false;
  let emptyVariant = null;
  let fallbackSuggested = [];
  let noMatchSuggested = [];

  if (mode === 'recent') {
    if (items.length === 0) {
      emptyVariant = 'empty-library';
    } else {
      headLabel = 'RECENTLY SAVED';
      headSub = `· your ${items.length} latest · acts as your library on load`;
    }
  } else if (mode === 'browse') {
    if (items.length === 0) {
      emptyVariant = 'empty-browse';
    } else {
      headLabel = 'BROWSE';
      headSub = `· ${tagPhrase} · ${items.length} item${items.length === 1 ? '' : 's'} · by date saved`;
    }
  } else if (mode === 'search-normal') {
    headLabel = hasTags ? 'SEARCH IN TAGS' : 'SEARCH';
    headSub = `${hasTags ? `· ${tagPhrase} ` : '· '}${qShow} · ${items.length} result${items.length === 1 ? '' : 's'}`;
  } else if (mode === 'search-approx') {
    showFallback = true;
    headLabel = 'APPROXIMATE';
    headSub = `· ${qShow} · no exact matches · ${items.length} close`;
    const counts = {};
    items.forEach((r) =>
      r.tags?.forEach((t) => {
        if (!selectedTags.includes(t.name)) counts[t.name] = (counts[t.name] || 0) + 1;
      })
    );
    fallbackSuggested = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 4);
  } else if (mode === 'search-nomatch') {
    emptyVariant = 'no-match';
    headLabel = hasTags ? 'SEARCH IN TAGS' : 'SEARCH';
    headSub = `· ${qShow} · 0 results`;
    noMatchSuggested = allTags
      .filter((t) => !selectedTags.includes(t.name))
      .slice(0, 5)
      .map((t) => t.name);
  }

  const showRail = allTags.length > 0;
  const showScore = mode === 'search-normal' || mode === 'search-approx';
  const showDeepSearchOption = (mode === 'search-approx' || mode === 'search-nomatch') && !deepSearch;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-bg-base font-sans" style={{ WebkitFontSmoothing: 'antialiased' }}>
      <div className="max-w-[840px] mx-auto px-8 pt-10 pb-[160px] box-border">

        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-y-3 pb-6 border-b border-border-subtle">
          <div className="flex items-center gap-[14px] shrink-0">
            <span className="w-[30px] h-[30px] rounded-[8px] bg-text-primary flex items-center justify-center flex-none mr-1">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#0a0a0b">
                <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.7L5 21V4a1 1 0 0 1 1-1z" />
              </svg>
            </span>
            <span className="text-[15.5px] font-semibold tracking-tight text-text-primary whitespace-nowrap">Internet Expedition</span>
            <span className="text-border-strong text-[15px] mx-[1px]">/</span>
            <span className="text-[15.5px] font-semibold tracking-tight text-text-primary">Search</span>
            <Badge tone="warning" size="xs" className="ml-1.5 uppercase">dev</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {showPipeline && (
              <Link
                to="/pipeline"
                className="inline-flex items-center gap-2 no-underline bg-bg-raised border border-border-default rounded-[8px] text-text-secondary font-mono text-[11.5px] tracking-[0.04em] px-3 py-[7px] cursor-pointer hover:border-border-strong hover:text-text-primary hover:bg-bg-hover-strong transition-all group"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <circle cx="5" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.7" />
                  <circle cx="19" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M5 8.2v3.3a3 3 0 0 0 3 3h8.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                Pipeline
                <svg className="text-text-faint group-hover:text-text-secondary group-hover:translate-x-[2px] transition-all" width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            )}
            {showPipeline && (
              <Link
                to="/retrieval-quality"
                className="inline-flex items-center gap-2 no-underline bg-bg-raised border border-border-default rounded-[8px] text-text-secondary font-mono text-[11.5px] tracking-[0.04em] px-3 py-[7px] cursor-pointer hover:border-border-strong hover:text-text-primary hover:bg-bg-hover-strong transition-all group"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="6.4" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M11 7v4l2.6 2.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Retrieval Quality
                <svg className="text-text-faint group-hover:text-text-secondary group-hover:translate-x-[2px] transition-all" width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            )}
            <span className="font-mono text-[11px] tracking-[0.04em] text-text-faint">
              semantic retrieval
            </span>
          </div>
        </div>

        {/* Search input */}
        <SearchInput
          value={inputValue}
          onChange={handleInput}
          onClear={handleClear}
          loading={loading}
          showClear={inputValue.length > 0}
        />

        {/* Tag rail */}
        {showRail && (
          <TagRail
            tags={allTags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onClearAll={clearAllTags}
          />
        )}

        {/* Error banner */}
        {error && (
          <Callout tone="error" className="mt-4">
            <span className="font-mono text-[13px] text-accent-error">{error}</span>
          </Callout>
        )}

        {/* Unembedded-complete banner (B-23) — non-dev-gated per M-39 */}
        {!error && unembeddedCount > 0 && (
          <Callout tone="warning" className="mt-4">
            <span className="font-mono text-[13px]">
              {unembeddedCount} saved item{unembeddedCount === 1 ? '' : 's'} aren't searchable yet — re-index needed.
            </span>
          </Callout>
        )}

        {!error && (
          <>
            {/* Results header */}
            {headLabel && <ResultsHeader label={headLabel} sub={headSub} />}

            {/* Fallback banner (approx mode) */}
            {showFallback && (
              <FallbackBanner suggestedTags={fallbackSuggested} onPickTag={pickTag} />
            )}

            {/* Empty states */}
            {emptyVariant && (
              <EmptyState
                variant={emptyVariant}
                tagPhrase={tagPhrase}
                suggestedTags={noMatchSuggested}
                onClearAll={clearAllTags}
                onPickTag={pickTag}
              />
            )}

            {/* Deep search escape hatch (B-13) -- re-runs against every embedded
                chunk with no candidate cap, for when the fast default search
                doesn't turn up something the user knows is saved */}
            {showDeepSearchOption && (
              <button
                type="button"
                onClick={handleDeepSearch}
                disabled={loading}
                className="mt-3 inline-flex items-center gap-2 bg-bg-raised border border-border-default rounded-[8px] text-text-secondary font-mono text-[11.5px] tracking-[0.04em] px-3 py-[7px] cursor-pointer hover:border-border-strong hover:text-text-primary hover:bg-bg-hover-strong transition-all disabled:opacity-50"
              >
                Deep search — check every saved item, no shortcuts
              </button>
            )}

            {/* Result cards */}
            {!emptyVariant && items.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <ResultCard
                    key={item.id}
                    item={item}
                    showScore={showScore}
                    onDelete={(id, title) => setConfirm({ id, title })}
                    onPickTag={pickTag}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirm modal */}
      <DeleteConfirmModal
        open={confirm !== null}
        title={confirm?.title || ''}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
