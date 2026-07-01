import { useState, useEffect, useRef } from 'react';

import {
  SetupNav,
  ProviderToggle,
  EmbeddingSection,
  GenerationSection,
  TranscriptionSection,
  ApiKeysSection,
  ReadinessSection,
  AdvancedDevMode,
  SetupCompleteModal,
  SetupDoneScreen,
  SectionHeader,
  Button,
} from '../design-system';

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------
const DEF = {
  ollama: { embed: 'nomic-embed-text-v2-moe', gen: 'gemma4:e2b' },
  openai: { embed: 'text-embedding-3-small', gen: 'gpt-4o-mini' },
};

// Approximate download sizes in MB
const MODEL_SIZES = {
  'nomic-embed-text-v2-moe': 768,
  'gemma4:e2b': 7200,
};

const WHISPER_SIZES = { tiny: 39, base: 74, small: 244, medium: 769, large: 1536 };

// ---------------------------------------------------------------------------
// SetupPage
// ---------------------------------------------------------------------------
export default function SetupPage() {
  // --- state ---
  const [top, setTop] = useState('ollama');
  const [expanded, setExpanded] = useState(false);

  const [embedProvider, setEmbedProvider] = useState('ollama');
  const [embedModel, setEmbedModel] = useState('nomic-embed-text-v2-moe');

  const [genProvider, setGenProvider] = useState('ollama');
  const [genModel, setGenModel] = useState('gemma4:e2b');

  const [whisper, setWhisper] = useState('base');

  const [keys, setKeys] = useState({ openai: '', anthropic: '', google: '' });
  const [showKey, setShowKey] = useState({ openai: false, anthropic: false, google: false });

  const [devMode, setDevMode] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [checkRows, setCheckRows] = useState([]);
  const [checkState, setCheckState] = useState('idle'); // 'idle'|'running'|'ok'|'error'

  const [activeSection, setActiveSection] = useState('welcome');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState(false);

  // timer refs for cleanup
  const timerRefs = useRef([]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const neededProviders = [...new Set([embedProvider, genProvider])].filter(
    (p) => p !== 'ollama'
  );
  const showKeyCard = neededProviders.length > 0;
  const allKeysFilled = neededProviders.every((p) => keys[p]?.trim().length > 0);
  const canComplete = allKeysFilled && checkState === 'ok';

  // ---------------------------------------------------------------------------
  // Provider toggle → cascading defaults
  // ---------------------------------------------------------------------------
  function handleSetTop(id) {
    if (id === 'custom') {
      setTop('custom');
      setExpanded(true);
      return;
    }
    const d = DEF[id];
    setTop(id);
    setExpanded(false);
    setEmbedProvider(id);
    setEmbedModel(d.embed);
    setGenProvider(id);
    setGenModel(d.gen);
    // Re-run check after cascade
    scheduleCheck();
  }

  function handleEmbedProvider(val) {
    setEmbedProvider(val);
    setTop('custom');
    // reset to first model for that provider
    const firstModels = {
      ollama: 'nomic-embed-text-v2-moe',
    };
    setEmbedModel(firstModels[val] || '');
    scheduleCheck();
  }

  function handleEmbedModel(val) {
    setEmbedModel(val);
    setTop('custom');
    scheduleCheck();
  }

  function handleGenProvider(val) {
    setGenProvider(val);
    setTop('custom');
    const firstModels = {
      ollama: 'gemma4:e2b',
      openai: 'gpt-4o-mini',
      anthropic: 'claude-haiku-4',
      google: 'gemini-2.0-flash',
    };
    setGenModel(firstModels[val] || '');
    scheduleCheck();
  }

  function handleGenModel(val) {
    setGenModel(val);
    setTop('custom');
    scheduleCheck();
  }

  // debounce flag so cascading state updates don't trigger multiple runs
  const checkScheduled = useRef(false);
  function scheduleCheck() {
    if (checkScheduled.current) return;
    checkScheduled.current = true;
    setTimeout(() => {
      checkScheduled.current = false;
      // will be triggered via effect
    }, 0);
  }

  // ---------------------------------------------------------------------------
  // Build check rows from current state
  // ---------------------------------------------------------------------------
  function buildRows(eProvider, eModel, gProvider, gModel, wModel) {
    const rows = [];
    if (eProvider === 'ollama' || gProvider === 'ollama') {
      rows.push({ id: 'service', label: 'ollama serve', kind: 'service', size: 0 });
    }
    if (eProvider === 'ollama') {
      rows.push({
        id: 'embed',
        label: eModel,
        kind: 'model',
        size: MODEL_SIZES[eModel] || 300,
      });
    }
    if (gProvider === 'ollama') {
      rows.push({
        id: 'gen',
        label: gModel,
        kind: 'model',
        size: MODEL_SIZES[gModel] || 3000,
      });
    }
    rows.push({
      id: 'whisper',
      label: `whisper-${wModel}`,
      kind: 'model',
      size: WHISPER_SIZES[wModel] || 74,
    });
    return rows.map((r) => ({ ...r, status: 'pending', loaded: 0 }));
  }

  // ---------------------------------------------------------------------------
  // Readiness check — real API
  // ---------------------------------------------------------------------------
  function clearTimers() {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }

  const pollRef = useRef(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function runCheck() {
    clearTimers();
    stopPolling();

    const rows = buildRows(embedProvider, embedModel, genProvider, genModel, whisper);
    setCheckRows(rows.map((r) => ({ ...r, status: 'pending' })));
    setCheckState('running');

    // Mark ollama service row as running immediately
    setCheckRows((prev) =>
      prev.map((r) => (r.kind === 'service' ? { ...r, status: 'running' } : r))
    );

    // Collect which ollama models need pulling
    const ollamaModels = rows
      .filter((r) => r.kind === 'model' && r.id !== 'whisper')
      .map((r) => r.label);

    if (ollamaModels.length === 0) {
      // No local models needed (cloud providers only) — mark all ok immediately
      setCheckRows((prev) => prev.map((r) => ({ ...r, status: 'ok', loaded: r.size })));
      setCheckState('ok');
      return;
    }

    // All keys to track: ollama model labels + whisper key
    const whisperKey = `whisper-${whisper}`;
    const allKeys = [...ollamaModels, whisperKey];

    // Kick off pulls
    try {
      const res = await fetch('/setup/pull-models/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: ollamaModels, whisper }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
    } catch {
      setCheckState('error');
      return;
    }

    // Mark service row ok, all model rows as progress
    setCheckRows((prev) =>
      prev.map((r) => {
        if (r.kind === 'service') return { ...r, status: 'ok' };
        if (ollamaModels.includes(r.label)) return { ...r, status: 'progress', loaded: 0 };
        if (r.id === 'whisper') return { ...r, status: 'progress', loaded: 0 };
        return r;
      })
    );

    // Poll pull status every second
    startPolling(allKeys, whisperKey);
  }

  function startPolling(allKeys, whisperKey) {
    // If a key is completely absent from the status response for this many
    // consecutive polls we treat it as an error (covers Django restart wiping
    // the in-memory state while the frontend is still polling).
    const MISSING_LIMIT = 30;
    const missingCount = {};

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/setup/pull-status/');
        const data = await res.json();

        setCheckRows((prev) =>
          prev.map((r) => {
            const key = r.id === 'whisper' ? whisperKey : r.label;
            if (!allKeys.includes(key)) return r;
            const info = data[key];
            if (!info) return r;
            if (info.status === 'done') return { ...r, status: 'ok', loaded: r.size };
            if (info.status === 'error') return { ...r, status: 'error' };
            return { ...r, status: 'progress', loaded: Math.round((info.percent / 100) * r.size) };
          })
        );

        let forceStop = false;
        for (const k of allKeys) {
          if (!data[k]) {
            missingCount[k] = (missingCount[k] || 0) + 1;
            if (missingCount[k] >= MISSING_LIMIT) forceStop = true;
          } else {
            missingCount[k] = 0;
          }
        }

        const allDone = allKeys.every(
          (k) => data[k]?.status === 'done' || data[k]?.status === 'error'
        );
        const anyError = allKeys.some((k) => data[k]?.status === 'error');

        if (allDone || forceStop) {
          stopPolling();
          setCheckState(anyError || forceStop ? 'error' : 'ok');
        }
      } catch {
        stopPolling();
        setCheckState('error');
      }
    }, 1000);
  }

  useEffect(() => { document.title = 'Bookmark · Setup'; }, []);

  // Stop polling on unmount
  useEffect(() => () => stopPolling(), []);

  // Resume polling on page reload if download is still in progress
  useEffect(() => {
    const whisperKey = `whisper-${whisper}`;
    const rows = buildRows(embedProvider, embedModel, genProvider, genModel, whisper);
    const ollamaModels = rows
      .filter((r) => r.kind === 'model' && r.id !== 'whisper')
      .map((r) => r.label);
    const allKeys = [...ollamaModels, whisperKey];

    fetch('/setup/pull-status/')
      .then((r) => r.json())
      .then((data) => {
        const anyActive = allKeys.some((k) => data[k]?.status === 'pulling');
        if (!anyActive) return;

        setCheckRows(rows.map((r) => {
          const key = r.id === 'whisper' ? whisperKey : r.label;
          const info = data[key];
          if (!info) return { ...r, status: 'pending', loaded: 0 };
          if (info.status === 'done') return { ...r, status: 'ok', loaded: r.size };
          if (info.status === 'error') return { ...r, status: 'error', loaded: 0 };
          return { ...r, status: 'progress', loaded: Math.round((info.percent / 100) * r.size) };
        }));
        setCheckState('running');
        startPolling(allKeys, whisperKey);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Scroll-spy nav with IntersectionObserver
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const sectionIds = ['welcome', 'provider', 'embedding', 'generation', 'transcription',
      ...(showKeyCard ? ['apikeys'] : []), 'readiness', 'finish'];

    const observers = [];
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: '-42% 0px -52% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [showKeyCard, done]);

  // cleanup timers on unmount
  useEffect(() => () => clearTimers(), []);

  // ---------------------------------------------------------------------------
  // Complete flow
  // ---------------------------------------------------------------------------
  function handleComplete() {
    if (!canComplete) return;
    setConfirmOpen(true);
  }

  async function handleConfirmComplete() {
    setConfirmOpen(false);
    try {
      const res = await fetch('/setup/complete/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embedding_provider: embedProvider,
          embedding_model: embedModel,
          generation_provider: genProvider,
          generation_model: genModel,
          whisper_model: whisper,
          dev_mode: devMode,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(`Setup failed: ${data.error || res.statusText}`);
        return;
      }
    } catch (err) {
      alert(`Setup failed: ${err.message}`);
      return;
    }
    setDone(true);
  }

  // ---------------------------------------------------------------------------
  // Nav items
  // ---------------------------------------------------------------------------
  const navItems = [
    { id: 'welcome', label: 'Welcome', show: true },
    { id: 'provider', label: 'Provider', show: true },
    { id: 'embedding', label: 'Embedding', show: true },
    { id: 'generation', label: 'Generation', show: true },
    { id: 'transcription', label: 'Transcription', show: true },
    { id: 'apikeys', label: 'API keys', show: showKeyCard },
    { id: 'readiness', label: 'Readiness', show: true },
    { id: 'finish', label: 'Finish', show: true },
  ].filter((n) => n.show);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      className="min-h-screen bg-bg-base font-sans"
      style={{ WebkitFontSmoothing: 'antialiased' }}
    >
      {done ? (
        <SetupDoneScreen
          embedModel={embedModel}
          genModel={genModel}
          whisper={whisper}
          devMode={devMode}
        />
      ) : (
        <div className="flex gap-[60px] w-full max-w-[1020px] mx-auto px-8 py-[72px] pb-[200px] items-start">
          <SetupNav items={navItems} activeSection={activeSection} />

          <div className="flex-1 min-w-0 flex flex-col gap-[52px]">
            {/* ---- Welcome ---- */}
            <section id="welcome">
              <SectionHeader
                eyebrow="Bookmark"
                title="Welcome"
                description="This wizard configures your local AI pipeline. All models run on your machine unless you choose a hosted provider. You'll only need to do this once."
                className="max-w-[520px]"
              />
            </section>

            {/* ---- Provider ---- */}
            <section id="provider">
              <SectionHeader eyebrow="Provider" title="Choose your provider" />
              <div className="mt-4">
                <ProviderToggle top={top} onSetTop={handleSetTop} />
              </div>
            </section>

            {/* ---- Embedding ---- */}
            <section id="embedding">
              <SectionHeader eyebrow="Embedding" eyebrowTag="permanent" title="Embedding model" />
              <div className="mt-4">
                <EmbeddingSection
                  expanded={expanded}
                  embedProvider={embedProvider}
                  embedModel={embedModel}
                  onEmbedProvider={handleEmbedProvider}
                  onEmbedModel={handleEmbedModel}
                  onCustomize={() => { setExpanded(true); setTop('custom'); }}
                  onToggleExpanded={() => setExpanded((v) => !v)}
                />
              </div>
            </section>

            {/* ---- Generation ---- */}
            <section id="generation">
              <SectionHeader eyebrow="Generation" title="Generation model" />
              <div className="mt-4">
                <GenerationSection
                  expanded={expanded}
                  genProvider={genProvider}
                  genModel={genModel}
                  onGenProvider={handleGenProvider}
                  onGenModel={handleGenModel}
                  onCustomize={() => { setExpanded(true); setTop('custom'); }}
                />
              </div>
            </section>

            {/* ---- Transcription ---- */}
            <section id="transcription">
              <SectionHeader eyebrow="Transcription" title="Whisper model" />
              <div className="mt-4">
                <TranscriptionSection whisper={whisper} onSetWhisper={setWhisper} />
              </div>
            </section>

            {/* ---- API Keys (conditional) ---- */}
            {showKeyCard && (
              <section id="apikeys">
                <SectionHeader eyebrow="API keys" title="API keys" />
                <div className="mt-4">
                  <ApiKeysSection
                    neededProviders={neededProviders}
                    keys={keys}
                    showKey={showKey}
                    onSetKey={(prov, val) => setKeys((k) => ({ ...k, [prov]: val }))}
                    onToggleShowKey={(prov) => setShowKey((s) => ({ ...s, [prov]: !s[prov] }))}
                  />
                </div>
              </section>
            )}

            {/* ---- Readiness ---- */}
            <section id="readiness">
              <SectionHeader eyebrow="Readiness" title="System check" />
              <div className="mt-4">
                <ReadinessSection
                  checkRows={checkRows}
                  checkState={checkState}
                  onRunCheck={runCheck}
                />
              </div>
            </section>

            {/* ---- Advanced ---- */}
            <AdvancedDevMode
              devMode={devMode}
              onToggleDev={setDevMode}
              advancedOpen={advancedOpen}
              onToggleAdvanced={() => setAdvancedOpen((v) => !v)}
            />

            {/* ---- Finish ---- */}
            <section id="finish">
              <SectionHeader eyebrow="Finish" title="Complete setup" />

              <div className="flex flex-col gap-4 mt-4">
                <Button variant="primary" size="lg" fullWidth disabled={!canComplete} onClick={handleComplete}>
                  Complete setup
                </Button>

                {!allKeysFilled && neededProviders.length > 0 && (
                  <p className="text-[12px] text-text-faint text-center">
                    Add your API {neededProviders.length === 1 ? 'key' : 'keys'} above to continue.
                  </p>
                )}
                {checkState !== 'ok' && (
                  <p className="text-[12px] text-text-faint text-center">
                    Run the system check above to continue.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      <SetupCompleteModal
        open={confirmOpen}
        embedModel={embedModel}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmComplete}
      />
    </div>
  );
}
