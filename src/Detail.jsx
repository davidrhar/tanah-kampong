import { LANDMARKS, km, hasPin, psf, foreigner, fmtAcres, fmtSqft, fmtSqm, fmtRM, fmtSGD, fmtPsf, ZONING_LABEL, PREC_LABEL, EVIDENCE, plots } from './model.js';

const FOREIGN_TONE = { likely: 'under', verify: 'agent', no: 'over', unknown: 'unclear' };
const TITLE_LABEL = { agricultural: 'Agricultural title', residential: 'Residential title', industrial: 'Industrial title', commercial: 'Commercial title', building: 'Building title', unknown: 'Title not stated' };

export default function Detail({ plot: p, rate, groups, onSelect }) {
  const f = foreigner(p);
  const mine = groups.filter((g) => g.members.some((m) => m.id === p.id) && !g.bundle);
  const byId = new Map(plots.map((x) => [x.id, x]));
  return (
    <>
      <div>
        <span className="eyebrow">{[p.locality, p.mukim && `Mukim ${p.mukim}`, p.district].filter(Boolean).join(' · ') || 'Location from listing title'}</span>
        <h2 style={{ marginTop: 4 }}>{p.title}</h2>
        <div className="facts">
          <span className={`zn ${p.zoning || 'unknown'}`}>{ZONING_LABEL[p.zoning || 'unknown']} zoning</span>
          <span className="chip">{TITLE_LABEL[p.titleType || 'unknown']}</span>
          {p.tenure && <span className="chip">{p.tenure}</span>}
          {p.international && <span className="chip"><b>International lot</b></span>}
          {p.bumiLot && <span className="chip">Bumi lot</span>}
        </div>
      </div>
      <div>
        <div className="price">{fmtSGD(p.priceRM, rate)}</div>
        <div className="sub">{fmtRM(p.priceRM)} asking · {fmtPsf(psf(p))} psf{p.psfRM == null && psf(p) != null ? ' (worked out)' : ''}</div>
        <div className="sub">{fmtAcres(p.acres)} · {fmtSqft(p.acres)} · {fmtSqm(p.acres)}</div>
      </div>
      <span className={`pill ${FOREIGN_TONE[f.k]}`} title="Foreign buyers need state consent and a minimum price. Confirm with a Johor conveyancing lawyer.">{f.label}</span>

      {mine.length > 0 && (
        <div className="callout">
          <b>Could combine with</b>
          {mine.map((g) => (
            <div key={g.id} style={{ marginTop: 6 }}>
              <span className={`ev ${g.evidence}`}>{EVIDENCE[g.evidence].label}</span>{' · '}{fmtAcres(g.acres)} together
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {g.members.filter((m) => m.id !== p.id).map((m) => <button key={m.id} className="link" style={{ padding: 0, color: 'var(--brand-ink)' }} onClick={() => onSelect(m.id)}>{m.title}</button>)}
              </div>
            </div>
          ))}
        </div>
      )}

      <dl className="kv">
        {p.adjacent && <><dt>Seller on adjacency</dt><dd>“{p.adjacent}”</dd></>}
        {p.lotNo && <><dt>Lot</dt><dd>{p.lotNo}</dd></>}
        {p.frontage && <><dt>Road access</dt><dd>{p.frontage}</dd></>}
        {p.utilities && <><dt>Utilities</dt><dd>{p.utilities}</dd></>}
        {p.notes && <><dt>Notes</dt><dd>{p.notes}</dd></>}
        <dt>Pin</dt><dd><span className={`prec ${p.locPrecision}`}>{{ exact: 'Exact (GPS or lot pin)', road: 'Road or kampung centre', area: 'Town centre only' }[p.locPrecision]}</span>{p.locPrecision !== 'exact' && <span className="muted"> · the real plot can be some way off</span>}</dd>
        {hasPin(p) && <><dt>Distance</dt><dd>{LANDMARKS.map((l) => `${l.short} ${km([p.lat, p.lng], l.at).toFixed(1)} km`).join(' · ')}<div className="muted" style={{ fontSize: 12 }}>Straight line, not road distance</div></dd></>}
        <dt>Source</dt><dd>{p.source} · seen {p.seen}{p.listedDate ? ` · listed ${p.listedDate}` : ''}{p.dupOf && byId.get(p.dupOf) ? <div className="muted">May be the same land as {byId.get(p.dupOf).title}</div> : null}</dd>
      </dl>
      <div className="actions">
        {p.url && <a className={`btn ${p.urlKind === 'listing' ? 'primary' : ''}`} href={p.url} target="_blank" rel="noreferrer">{p.urlKind === 'listing' ? 'Open listing ↗' : 'Open search page ↗'}</a>}
      </div>
      {p.urlKind === 'search' && <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>We only have a search page for this one, not the listing itself. It may have moved or sold.</p>}
    </>
  );
}
