import { useMemo, useState } from 'react';
import MapView, { ZONE_COLOUR, EV_COLOUR } from './MapView.jsx';
import Detail from './Detail.jsx';
import { plots, distinct, psf, nearestCrossing, foreigner, memberOf, fmtAcres, fmtRM, fmtSGD, fmtPsf, ZONING_LABEL, PREC_LABEL, EVIDENCE } from './model.js';

const ZONES = ['residential', 'agricultural', 'industrial', 'commercial', 'mixed', 'unknown'];
const median = (xs) => { const s = xs.filter((x) => x != null).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };

export default function Plots({ rate, target, groups, selectedId, setSelectedId, onCombine }) {
  const [zones, setZones] = useState(() => new Set(ZONES));
  const [minAcres, setMinAcres] = useState(0);
  const [maxPriceM, setMaxPriceM] = useState('');
  const [foreignOnly, setForeignOnly] = useState(false);
  const [view, setView] = useState('all'); // all | standalone | combinable
  const [hideTown, setHideTown] = useState(false);
  const [hideDup, setHideDup] = useState(true);
  const [showLinks, setShowLinks] = useState(true);
  const [sort, setSort] = useState({ k: 'acres', dir: -1 });

  const member = useMemo(() => memberOf(groups.filter((g) => !g.bundle)), [groups]);
  const counts = useMemo(() => Object.fromEntries(ZONES.map((z) => [z, plots.filter((p) => p.zoning === z).length])), []);

  const list = useMemo(() => {
    const arr = plots.filter((p) => {
      if (!zones.has(p.zoning || 'unknown')) return false;
      if ((p.acres ?? 0) < minAcres) return false;
      if (maxPriceM && p.priceRM != null && p.priceRM > Number(maxPriceM) * 1e6) return false;
      if (foreignOnly && !['likely', 'verify'].includes(foreigner(p).k)) return false;
      if (hideTown && p.locPrecision === 'area') return false;
      if (hideDup && p.dupOf) return false;
      if (view === 'standalone' && !((p.acres ?? 0) >= target)) return false;
      if (view === 'combinable' && !member.has(p.id)) return false;
      return true;
    });
    const val = {
      acres: (p) => p.acres ?? -1, price: (p) => p.priceRM ?? 1e12, psf: (p) => psf(p) ?? 1e9,
      dist: (p) => nearestCrossing(p)?.d ?? 1e9, title: (p) => p.title.toLowerCase(),
    }[sort.k];
    return arr.sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir);
  }, [zones, minAcres, maxPriceM, foreignOnly, hideTown, hideDup, view, sort, target, member]);

  const visibleIds = new Set(list.map((p) => p.id));
  const mapGroups = groups.filter((g) => g.members.some((m) => visibleIds.has(m.id)));
  const selected = plots.find((p) => p.id === selectedId);
  const standalone = distinct.filter((p) => (p.acres ?? 0) >= target).length;
  const smallLinked = distinct.filter((p) => (p.acres ?? 0) < target && member.has(p.id)).length;
  const sortBy = (k, dir = -1) => setSort((s) => (s.k === k ? { k, dir: -s.dir } : { k, dir }));
  const th = (k, label, dir, cls = '') => <th className={`sort ${cls} ${sort.k === k ? 'on' : ''}`} onClick={() => sortBy(k, dir)}>{label}{sort.k === k ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}</th>;
  const toggleZone = (z) => setZones((s) => { const n = new Set(s); n.has(z) ? n.delete(z) : n.add(z); return n; });

  return (
    <div className="stack">
      <section className="pagehead">
        <span className="eyebrow">Southern Johor · land for one family compound</span>
        <h1>Where could the kampong go?</h1>
        <p>Every plot we could find for sale within reach of the Second Link and the Causeway. Plots of {target} acres or more work on their own. Smaller ones count too, when a neighbour could be bought with them.</p>
      </section>

      <div className="kpis">
        <button className={`kpi click ${view === 'all' ? 'on' : ''}`} onClick={() => setView('all')}><span className="eyebrow">Plots</span><span className="v">{distinct.length}</span><span className="s">distinct · {plots.length - distinct.length} likely duplicates</span></button>
        <button className={`kpi click ${view === 'standalone' ? 'on' : ''}`} onClick={() => setView('standalone')}><span className="eyebrow">Big enough alone</span><span className="v">{standalone}</span><span className="s">{target}+ acres</span></button>
        <button className={`kpi click ${view === 'combinable' ? 'on' : ''}`} onClick={() => setView('combinable')}><span className="eyebrow">Could combine</span><span className="v">{groups.length}</span><span className="s">sets · {smallLinked} small plots with a neighbour lead</span></button>
        <div className="kpi"><span className="eyebrow">Median asking</span><span className="v">{fmtPsf(median(distinct.map(psf)))}</span><span className="s">per sqft of land</span></div>
      </div>

      <div className="mapwrap">
        <MapView plots={list} groups={mapGroups} selectedId={selectedId} showLinks={showLinks} onSelect={setSelectedId} />
        <aside className="layers">
          <div>
            <h3>Zoning</h3>
            {ZONES.filter((z) => counts[z]).map((z) => (
              <label key={z}><input type="checkbox" checked={zones.has(z)} onChange={() => toggleZone(z)} /><span className="sw" style={{ background: ZONE_COLOUR[z] }} />{ZONING_LABEL[z]}<span className="cnt">{counts[z]}</span></label>
            ))}
          </div>
          <div className="rowf"><span>Min size (acres)</span><input type="number" min="0" step="0.5" value={minAcres} onChange={(e) => setMinAcres(Number(e.target.value) || 0)} /></div>
          <div className="rowf"><span>Max asking (RM million)</span><input type="number" min="0" step="0.5" placeholder="any" value={maxPriceM} onChange={(e) => setMaxPriceM(e.target.value)} /></div>
          <div>
            <h3>Show</h3>
            <label><input type="checkbox" checked={foreignOnly} onChange={(e) => setForeignOnly(e.target.checked)} />International lots only</label>
            <label><input type="checkbox" checked={hideTown} onChange={(e) => setHideTown(e.target.checked)} />Hide town-only pins</label>
            <label><input type="checkbox" checked={hideDup} onChange={(e) => setHideDup(e.target.checked)} />Hide likely duplicates</label>
            <label><input type="checkbox" checked={showLinks} onChange={(e) => setShowLinks(e.target.checked)} />Combination lines</label>
          </div>
          <div>
            <h3>Lines</h3>
            {Object.entries(EVIDENCE).map(([k, e]) => <label key={k} title={e.hint} style={{ cursor: 'help' }}><span className="sw ln" style={{ background: EV_COLOUR[k] }} />{e.label}</label>)}
            <p className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>Dashed hollow pin: only the town is known. <button className="link" onClick={onCombine}>How combining works</button></p>
          </div>
        </aside>
      </div>

      <div className="split2">
        <section className="card">
          <header><h2>{list.length} plots</h2><span className="muted" style={{ fontSize: 12.5 }}>Click a row for details. Click a heading to sort.</span></header>
          <div className="scroller xl">
            <table className="tbl plots-tbl">
              <thead><tr>{th('title', 'Plot', 1)}{th('acres', 'Size', -1, 'r')}{th('price', 'Asking', 1, 'r')}{th('psf', 'psf', 1, 'r')}<th>Zoning</th>{th('dist', 'To crossing', 1, 'r')}<th>Pin</th></tr></thead>
              <tbody>
                {list.map((p) => {
                  const nc = nearestCrossing(p);
                  const g = member.get(p.id);
                  return (
                    <tr key={p.id} className={p.id === selectedId ? 'on' : ''} onClick={() => setSelectedId(p.id)}>
                      <td style={{ whiteSpace: 'normal', minWidth: 180 }}>{p.title}{g && <span className="tag" style={{ marginLeft: 6 }} title={EVIDENCE[g.evidence].label}>+{g.members.length - 1}</span>}</td>
                      <td className="r">{fmtAcres(p.acres)}</td>
                      <td className="r">{fmtSGD(p.priceRM, rate)}<div className="muted" style={{ fontSize: 11 }}>{fmtRM(p.priceRM)}</div></td>
                      <td className="r">{fmtPsf(psf(p))}</td>
                      <td><span className={`zn ${p.zoning || 'unknown'}`}>{ZONING_LABEL[p.zoning || 'unknown']}</span></td>
                      <td className="r">{nc ? `${nc.d.toFixed(0)} km` : '—'}<div className="muted" style={{ fontSize: 11 }}>{nc?.short}</div></td>
                      <td><span className={`prec ${p.locPrecision}`}>{PREC_LABEL[p.locPrecision] || '—'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="card detail">
          {selected ? <Detail plot={selected} rate={rate} groups={groups} onSelect={setSelectedId} /> : <p className="muted" style={{ margin: 0 }}>Pick a plot on the map or in the list.</p>}
        </aside>
      </div>
    </div>
  );
}
