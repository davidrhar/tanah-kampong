import { useState } from 'react';
import MapView, { EV_COLOUR } from './MapView.jsx';
import { plots, EVIDENCE, fmtAcres, fmtRM, fmtSGD, fmtPsf } from './model.js';

export default function Combine({ rate, groups, target, setTarget, gapM, setGapM, onOpenPlot }) {
  const [focus, setFocus] = useState(null);
  const [onlyReach, setOnlyReach] = useState(false);
  const shown = groups.filter((g) => !onlyReach || g.reaches);
  const byEv = Object.fromEntries(Object.keys(EVIDENCE).map((k) => [k, groups.filter((g) => g.evidence === k).length]));

  return (
    <div className="stack">
      <section className="pagehead">
        <span className="eyebrow">Combine plots</span>
        <h1>Small plots, side by side</h1>
        <p>A 1-acre plot is too small on its own. Two or three of them next to each other might make the compound. These are the sets that could fit together, strongest evidence first.</p>
      </section>

      <div className="callout">
        <b>Only the seller or a lot plan can show that plots touch.</b> Malaysia has no public cadastral map. Most pins here come from a road or kampung name, so “close on the map” is a lead to check, not a fact. Before you talk price, get each lot number from the agent, then a certified plan (<i>pelan akui</i>) or a title search at the Pejabat Tanah to confirm the shared boundary.
      </div>

      <div className="card">
        <div className="row" style={{ gap: 18 }}>
          <label className="field" style={{ minWidth: 160 }}>Compound needs (acres)<input type="number" min="0.5" step="0.5" value={target} onChange={(e) => setTarget(Number(e.target.value) || 2)} /></label>
          <label className="field" style={{ minWidth: 200 }}>“Pins close” means within (m)<input type="range" min="100" max="1500" step="50" value={gapM} onChange={(e) => setGapM(Number(e.target.value))} /><span className="num">{gapM} m</span></label>
          <label className="row" style={{ gap: 6, fontSize: 13 }}><input type="checkbox" checked={onlyReach} onChange={(e) => setOnlyReach(e.target.checked)} />Only sets that reach {target} acres</label>
          <span className="grow" style={{ flex: 1 }} />
          <div className="row" style={{ gap: 12, fontSize: 12.5 }}>
            {Object.entries(EVIDENCE).map(([k, e]) => <span key={k} title={e.hint} style={{ cursor: 'help' }}><span className="sw ln" style={{ background: EV_COLOUR[k], display: 'inline-block', verticalAlign: 'middle', marginRight: 5 }} />{e.label} <b className="num">{byEv[k]}</b></span>)}
          </div>
        </div>
      </div>

      <div className="split2">
        <div className="groups">
          {shown.length === 0 && <div className="card muted">No sets match. Try a wider “pins close” distance, or turn off “only sets that reach”.</div>}
          {shown.map((g) => (
            <div key={g.id} className={`grp ${g.evidence} ${focus === g.id ? 'on' : ''}`} onClick={() => setFocus(focus === g.id ? null : g.id)}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className={`ev ${g.evidence}`} title={EVIDENCE[g.evidence].hint}>{g.bundle ? 'One listing, several lots' : EVIDENCE[g.evidence].label}</span>
                {g.reaches ? <span className="pill under" style={{ fontSize: 12, padding: '3px 9px' }}>Reaches {target} ac</span> : <span className="pill unclear" style={{ fontSize: 12, padding: '3px 9px' }}>Short of {target} ac</span>}
              </div>
              <div className="row" style={{ gap: 16, alignItems: 'baseline' }}>
                <b style={{ fontFamily: 'var(--display)', fontSize: 20 }}>{fmtAcres(g.acres)}</b>
                <span className="num">{g.priceRM ? `${fmtSGD(g.priceRM, rate)} · ${fmtRM(g.priceRM)}` : 'Some prices missing'}</span>
                <span className="num muted">{fmtPsf(g.psf)} psf</span>
              </div>
              <div className="members">
                {g.members.map((m) => (
                  <div key={m.id}>
                    <button className="link" style={{ padding: 0, textAlign: 'left', color: 'var(--ink)' }} onClick={(e) => { e.stopPropagation(); onOpenPlot(m.id); }}>{m.title}</button>
                    <span className="num">{fmtAcres(m.acres)}</span><span className="num muted">{fmtRM(m.priceRM)}</span>
                  </div>
                ))}
              </div>
              {g.edges.length > 0 && <div className="muted" style={{ fontSize: 12 }}>{[...new Set(g.edges.map((e) => e.why))].slice(0, 3).join(' · ')}</div>}
              {g.bundle && g.members[0].adjacent && <div className="muted" style={{ fontSize: 12 }}>“{g.members[0].adjacent}”</div>}
            </div>
          ))}
        </div>
        <div className="mapwrap" style={{ gridTemplateColumns: '1fr', position: 'sticky', top: 120 }}>
          <MapView plots={plots} groups={groups} focusGroupId={focus} showLinks selectedId={null} onSelect={onOpenPlot} />
        </div>
      </div>
    </div>
  );
}
