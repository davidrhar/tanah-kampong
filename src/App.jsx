import { Component, useCallback, useEffect, useMemo, useState } from 'react';
import Logo from './Logo.jsx';
import Plots from './Plots.jsx';
import Combine from './Combine.jsx';
import Concepts from './Concepts.jsx';
import Method from './Method.jsx';
import { plots, combinations, DEFAULT_RATE } from './model.js';

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return <main><div className="card"><h2>Something broke</h2><pre className="error">{String(this.state.error)}</pre></div></main>;
    return this.props.children;
  }
}

const load = (k, d) => { try { const v = localStorage.getItem(`kampong:${k}`); return v == null ? d : JSON.parse(v); } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(`kampong:${k}`, JSON.stringify(v)); } catch { /* private mode */ } };
function useStored(k, d) {
  const [v, setV] = useState(() => load(k, d));
  useEffect(() => save(k, v), [k, v]);
  return [v, setV];
}

const TABS = [
  { key: 'plots', label: 'Plots' },
  { key: 'combine', label: 'Combine plots', isNew: true },
  { key: 'concepts', label: 'Compound concepts' },
  { key: 'method', label: 'Sources & limits' },
];

export default function App() {
  const [tab, setTab] = useState(() => (location.hash.slice(1) && TABS.some((t) => t.key === location.hash.slice(1)) ? location.hash.slice(1) : 'plots'));
  const [rate, setRate] = useStored('rate', DEFAULT_RATE);
  const [target, setTarget] = useStored('target', 2);
  const [gapM, setGapM] = useStored('gap', 400);
  const [selectedId, setSelectedId] = useState(null);
  const groups = useMemo(() => combinations(plots, { targetAcres: target, gapM }), [target, gapM]);
  const go = useCallback((t) => { setTab(t); history.replaceState(null, '', `#${t}`); window.scrollTo({ top: 0 }); }, []);
  const openPlot = useCallback((id) => { setSelectedId(id); go('plots'); }, [go]);

  return (
    <ErrorBoundary>
      <header className="topbar">
        <div className="in">
          <span onClick={() => go('plots')}><Logo sub="Kampong" /></span>
          <span className="grow" />
          <label className="fx" title="Used for every S$ figure. Ringgit figures are as listed.">
            1 RM = S$<input type="number" step="0.0005" min="0.1" max="1" value={rate} onChange={(e) => setRate(Number(e.target.value) || DEFAULT_RATE)} />
          </label>
          <span className="status"><span><span className="sdot" />{plots.length} plots</span></span>
        </div>
      </header>
      <main>
        <nav className="tabs" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => go(t.key)}>
              {t.label}{t.isNew && <span className="tag-new">NEW</span>}
            </button>
          ))}
        </nav>
        {tab === 'plots' && <Plots rate={rate} target={target} groups={groups} selectedId={selectedId} setSelectedId={setSelectedId} onCombine={() => go('combine')} />}
        {tab === 'combine' && <Combine rate={rate} groups={groups} target={target} setTarget={setTarget} gapM={gapM} setGapM={setGapM} onOpenPlot={openPlot} />}
        {tab === 'concepts' && <Concepts />}
        {tab === 'method' && <Method />}
      </main>
      <footer className="foot">Tanah Kampong · asking prices from public listings, not valuations · pins are approximate unless marked exact</footer>
    </ErrorBoundary>
  );
}
