import { useState, useEffect, useRef } from 'react';
import { CssVarsProvider, extendTheme } from '@mui/joy/styles';

import SetupNav from '../components/setup/SetupNav';
import ProviderToggle from '../components/setup/ProviderToggle';
import EmbeddingSection from '../components/setup/EmbeddingSection';
import GenerationSection from '../components/setup/GenerationSection';
import TranscriptionSection from '../components/setup/TranscriptionSection';
import ApiKeysSection from '../components/setup/ApiKeysSection';
import ReadinessSection from '../components/setup/ReadinessSection';
import AdvancedDevMode from '../components/setup/AdvancedDevMode';
import SetupCompleteModal from '../components/setup/SetupCompleteModal';
import SetupDoneScreen from '../components/setup/SetupDoneScreen';

// ---------------------------------------------------------------------------
// Joy dark theme scoped to this page
// ---------------------------------------------------------------------------
const darkTheme = extendTheme({
  colorSchemes: {
    dark: {
      palette: {
        background: { surface: '#161519', body: '#0a0a0b', popup: '#121116' },
        text: { primary: '#ededee', secondary: '#c9c7d0', tertiary: '#66646e' },
        neutral: {
          outlinedBorder: '#2a2930',
          outlinedColor: '#c9c7d0',
          outlinedBg: '#161519',
          outlinedHoverBg: '#1b1a20',
        },
        focusVisible: 'rgba(250,250,250,0.3)',
      },
    },
  },
  components: {
    JoySelect: {
      styleOverrides: {
        root: { backgroundColor: '#161519', borderColor: '#2a2930', color: '#ededee' },
        listbox: { backgroundColor: '#161519', borderColor: '#2a2930' },
      },
    },
    JoyOption: {
      styleOverrides: {
        root: { color: '#ededee', '&:hover': { backgroundColor: '#1b1a20' } },
      },
    },
    JoyInput: {
      styleOverrides: {
        root: { backgroundColor: '#161519', borderColor: '#2a2930', color: '#ededee' },
      },
    },
  },
});

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
  // 'mxbai-embed-large': 670,
  // 'all-minilm': 45,
  // 'text-embedding-3-small': 0,
  // 'text-embedding-3-large': 0,
  // 'text-embedding-004': 0,
  'gemma4:e2b': 7200,
  // 'llama3.2:3b': 2000,
  // 'qwen2.5:7b': 4700,
  // 'mistral:7b': 4100,
  // 'gpt-4o-mini': 0,
  // 'gpt-4o': 0,
  // 'claude-haiku-4': 0,
  // 'claude-sonnet-4': 0,
  // 'gemini-2.0-flash': 0,
  // 'gemini-1.5-pro': 0,
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
      // openai: 'text-embedding-3-small',
      // google: 'text-embedding-004',
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
  // Simulated readiness check  // TODO(backend): replace with real API call
  // ---------------------------------------------------------------------------
  function clearTimers() {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }

  function runCheck(simulateOffline = false) {
    clearTimers();
    const rows = buildRows(embedProvider, embedModel, genProvider, genModel, whisper);
    setCheckRows(rows.map((r) => ({ ...r, status: 'pending' })));
    setCheckState('running');

    rows.forEach((row, idx) => {
      // stagger start slightly
      const startDelay = idx * 120;

      if (row.kind === 'service') {
        const t1 = setTimeout(() => {
          setCheckRows((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, status: 'running' } : r))
          );
        }, startDelay);
        timerRefs.current.push(t1);

        const t2 = setTimeout(() => {
          const finalStatus = simulateOffline ? 'error' : 'ok';
          setCheckRows((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, status: finalStatus } : r))
          );
        }, startDelay + 650);
        timerRefs.current.push(t2);
      } else {
        // model: show progress bar filling over ~1300ms
        const t1 = setTimeout(() => {
          setCheckRows((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, status: 'progress', loaded: 0 } : r))
          );
        }, startDelay + 200);
        timerRefs.current.push(t1);

        const STEPS = 20;
        const STEP_MS = 1300 / STEPS;
        for (let step = 1; step <= STEPS; step++) {
          const s = step;
          const t = setTimeout(() => {
            setCheckRows((prev) =>
              prev.map((r) =>
                r.id === row.id ? { ...r, loaded: (r.size * s) / STEPS } : r
              )
            );
          }, startDelay + 200 + s * STEP_MS);
          timerRefs.current.push(t);
        }

        const t2 = setTimeout(() => {
          setCheckRows((prev) =>
            prev.map((r) =>
              r.id === row.id ? { ...r, status: 'ok', loaded: r.size } : r
            )
          );
        }, startDelay + 200 + 1300 + 80);
        timerRefs.current.push(t2);
      }
    });

    // final state resolution
    const maxDelay = rows.length * 120 + 1800;
    const tFinal = setTimeout(() => {
      setCheckState(simulateOffline ? 'error' : 'ok');
    }, maxDelay);
    timerRefs.current.push(tFinal);
  }

  function handleSimulateOffline() {
    runCheck(true);
  }

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
      const res = await fetch('/setup/', {
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
  // Section heading helper
  // ---------------------------------------------------------------------------
  function SectionEyebrow({ label, tag }) {
    return (
      <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-text-faint">
        {label}
        {tag && <span className="text-accent-warning"> · {tag}</span>}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <CssVarsProvider theme={darkTheme} defaultMode="dark">
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
                <SectionEyebrow label="Bookmark" />
                <h2 className="text-[21px] font-semibold tracking-tight text-text-primary mt-[7px] mb-3">
                  Welcome
                </h2>
                <p className="text-[14px] text-text-muted leading-relaxed max-w-[520px]">
                  This wizard configures your local AI pipeline. All models run on your machine
                  unless you choose a hosted provider. You&apos;ll only need to do this once.
                </p>
              </section>

              {/* ---- Provider ---- */}
              <section id="provider">
                <SectionEyebrow label="Provider" />
                <h2 className="text-[21px] font-semibold tracking-tight text-text-primary mt-[7px] mb-4">
                  Choose your provider
                </h2>
                <ProviderToggle top={top} onSetTop={handleSetTop} />
              </section>

              {/* ---- Embedding ---- */}
              <section id="embedding">
                <SectionEyebrow label="Embedding" tag="permanent" />
                <h2 className="text-[21px] font-semibold tracking-tight text-text-primary mt-[7px] mb-4">
                  Embedding model
                </h2>
                <EmbeddingSection
                  expanded={expanded}
                  embedProvider={embedProvider}
                  embedModel={embedModel}
                  onEmbedProvider={handleEmbedProvider}
                  onEmbedModel={handleEmbedModel}
                  onCustomize={() => { setExpanded(true); setTop('custom'); }}
                  onToggleExpanded={() => setExpanded((v) => !v)}
                />
              </section>

              {/* ---- Generation ---- */}
              <section id="generation">
                <SectionEyebrow label="Generation" />
                <h2 className="text-[21px] font-semibold tracking-tight text-text-primary mt-[7px] mb-4">
                  Generation model
                </h2>
                <GenerationSection
                  expanded={expanded}
                  genProvider={genProvider}
                  genModel={genModel}
                  onGenProvider={handleGenProvider}
                  onGenModel={handleGenModel}
                  onCustomize={() => { setExpanded(true); setTop('custom'); }}
                />
              </section>

              {/* ---- Transcription ---- */}
              <section id="transcription">
                <SectionEyebrow label="Transcription" />
                <h2 className="text-[21px] font-semibold tracking-tight text-text-primary mt-[7px] mb-4">
                  Whisper model
                </h2>
                <TranscriptionSection whisper={whisper} onSetWhisper={setWhisper} />
              </section>

              {/* ---- API Keys (conditional) ---- */}
              {showKeyCard && (
                <section id="apikeys">
                  <SectionEyebrow label="API keys" />
                  <h2 className="text-[21px] font-semibold tracking-tight text-text-primary mt-[7px] mb-4">
                    API keys
                  </h2>
                  <ApiKeysSection
                    neededProviders={neededProviders}
                    keys={keys}
                    showKey={showKey}
                    onSetKey={(prov, val) => setKeys((k) => ({ ...k, [prov]: val }))}
                    onToggleShowKey={(prov) => setShowKey((s) => ({ ...s, [prov]: !s[prov] }))}
                  />
                </section>
              )}

              {/* ---- Readiness ---- */}
              <section id="readiness">
                <SectionEyebrow label="Readiness" />
                <h2 className="text-[21px] font-semibold tracking-tight text-text-primary mt-[7px] mb-4">
                  System check
                </h2>
                <ReadinessSection
                  checkRows={checkRows}
                  checkState={checkState}
                  onRunCheck={() => runCheck(false)}
                  onSimulateOffline={handleSimulateOffline}
                />
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
                <SectionEyebrow label="Finish" />
                <h2 className="text-[21px] font-semibold tracking-tight text-text-primary mt-[7px] mb-4">
                  Complete setup
                </h2>

                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={!canComplete}
                    className={[
                      'w-full py-[13px] rounded-[10px] text-[14px] font-semibold tracking-tight transition-all cursor-pointer',
                      canComplete
                        ? 'bg-text-primary text-bg-base hover:opacity-90'
                        : 'bg-border-subtle text-text-faint cursor-not-allowed opacity-60',
                    ].join(' ')}
                  >
                    Complete setup
                  </button>

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
    </CssVarsProvider>
  );
}
