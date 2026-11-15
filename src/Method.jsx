import { Fragment } from 'react';
import { plots, EVIDENCE, PREC_LABEL } from './model.js';

export default function Method() {
  const by = (k) => Object.entries(plots.reduce((m, p) => ((m[p[k] || 'unknown'] = (m[p[k] || 'unknown'] || 0) + 1), m), {}));
  const seen = [...new Set(plots.map((p) => p.seen))].sort();
  return (
    <div className="stack">
      <section className="pagehead">
        <span className="eyebrow">Sources & limits</span>
        <h1>What this map can and can't tell you</h1>
      </section>
      <div className="grid3">
        <div className="card"><h3>Listings by source</h3><dl className="kv" style={{ marginTop: 8 }}>{by('source').map(([k, n]) => <Fragment key={k}><dt>{k}</dt><dd className="num">{n}</dd></Fragment>)}</dl></div>
        <div className="card"><h3>Pin accuracy</h3><dl className="kv" style={{ marginTop: 8 }}>{by('locPrecision').map(([k, n]) => <Fragment key={k}><dt>{PREC_LABEL[k] || k}</dt><dd className="num">{n}</dd></Fragment>)}</dl></div>
        <div className="card"><h3>Link kind</h3><dl className="kv" style={{ marginTop: 8 }}>{by('urlKind').map(([k, n]) => <Fragment key={k}><dt>{k === 'listing' ? 'Direct listing' : 'Search page only'}</dt><dd className="num">{n}</dd></Fragment>)}</dl><p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>Collected {seen[0]} to {seen[seen.length - 1]}</p></div>
      </div>
      <div className="card prose">
        <h2>What it does not capture</h2>
        <ul>
          <li><b>Whether plots actually touch.</b> Malaysia has no free public cadastral map. Only the seller's own words or a certified lot plan prove adjacency. Everything else is a lead.</li>
          <li><b>Exact locations.</b> Most listings name a road or kampung, not a lot. Pins sit at that name's centre, and the real plot can be a kilometre or more away. Footprint circles are drawn only for exact pins, and the shape is not known.</li>
          <li><b>Availability.</b> These are asking prices from public listings on the date shown. Land listings stay up long after they sell, and agents re-list the same land, so some rows may be duplicates.</li>
          <li><b>Value.</b> There are no transaction prices here (JPPH/NAPIC data is paid). psf shows what sellers ask, not what land sells for.</li>
          <li><b>Planning.</b> “Zoning” is what the listing claims. It often differs from the category on the title (an agricultural title in a residential zone is common). “Zoning not stated” means the listing names only the title, usually agricultural. The land may still be zoned residential. Check the local plan (<i>Rancangan Tempatan</i>) with the council (MBIP, MBJB, MPKu).</li>
        </ul>
        <h2>How the combination leads work</h2>
        <ul>{Object.values(EVIDENCE).map((e) => <li key={e.label}><b>{e.label}.</b> {e.hint}</li>)}</ul>
        <p>A set is only as strong as its weakest link. Two plots that are each big enough on their own are not shown as a set.</p>
        <h2>Confirming a combination</h2>
        <ol>
          <li>Ask each agent for the lot number (Lot / PTD / PTB) and mukim.</li>
          <li>Get a title search (<i>carian rasmi</i>) at the Pejabat Tanah for each lot: owner, restrictions, Bumi or international status, charges.</li>
          <li>Get the certified plan (<i>pelan akui</i>) from JUPEM to see the shared boundary and road access.</li>
          <li>Combining needs amalgamation of titles (<i>penyatuan tanah</i>) and, for agricultural titles, a conversion of use (<i>tukar syarat</i>). Both take months and carry premiums.</li>
        </ol>
        <h2>Foreign buyers</h2>
        <p>Foreign buyers need state consent and must meet Johor's minimum purchase price. Agricultural land is generally closed to them unless it is converted. International lots are the usual route. The rules change, so check the current threshold and consent process with a Johor conveyancing lawyer before acting.</p>
      </div>
    </div>
  );
}
