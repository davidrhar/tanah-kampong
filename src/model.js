// Plot data, units and the "which plots could be combined" logic.
import plotsData from '../data/plots.json';

export const plots = plotsData;
export const SQFT_PER_ACRE = 43560;
export const SQM_PER_ACRE = 4046.86;
export const DEFAULT_RATE = 0.3151; // SGD per MYR: fallback only, used until /api/fx answers (ECB reference 13 Nov 2026)

export const LANDMARKS = [
  { key: 'sl', name: 'Second Link CIQ', short: '2nd Link', at: [1.3778, 103.5964] }, // Sultan Abu Bakar Complex
  { key: 'cw', name: 'Causeway CIQ (BSI)', short: 'Causeway', at: [1.4627, 103.7643] },
  { key: 'rts', name: 'RTS Link, Bukit Chagar', short: 'RTS', at: [1.4637, 103.7609] },
];

export function km(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const hasPin = (p) => p.lat != null && p.lng != null;
export const nearestCrossing = (p) => {
  if (!hasPin(p)) return null;
  const [sl, cw] = [LANDMARKS[0], LANDMARKS[1]].map((l) => ({ ...l, d: km([p.lat, p.lng], l.at) }));
  return sl.d <= cw.d ? sl : cw;
};

// psf from the listing, or derived from price and size.
export const psf = (p) => p.psfRM ?? (p.priceRM && p.acres ? p.priceRM / (p.acres * SQFT_PER_ACRE) : null);

// Formatting
export const fmtAcres = (a) => (a == null ? '—' : `${a >= 10 ? a.toFixed(0) : a.toFixed(2).replace(/\.?0+$/, '')} ac`);
export const fmtSqft = (a) => (a == null ? '' : `${Math.round(a * SQFT_PER_ACRE).toLocaleString('en')} sqft`);
export const fmtSqm = (a) => (a == null ? '' : `${Math.round(a * SQM_PER_ACRE).toLocaleString('en')} m²`);
export const fmtRM = (v) => (v == null ? '—' : v >= 1e6 ? `RM ${(v / 1e6).toFixed(2)}M` : `RM ${Math.round(v / 1e3)}k`);
export const fmtSGD = (v, rate) => (v == null ? '—' : v * rate >= 1e6 ? `S$${((v * rate) / 1e6).toFixed(2)}M` : `S$${Math.round((v * rate) / 1e3)}k`);
export const fmtPsf = (v) => (v == null ? '—' : `RM ${v < 10 ? v.toFixed(1) : Math.round(v)}`);

export const ZONING_LABEL = { residential: 'Residential', agricultural: 'Agricultural', industrial: 'Industrial', commercial: 'Commercial', mixed: 'Mixed', unknown: 'Not stated' };
export const ZONING_HINT = 'The listing gives only the title (usually agricultural), not the zoning in the local plan. Ask the agent, or check with the council (MBIP, MBJB, MPKu): residential zoning means the title can be converted for houses.';
export const PREC_LABEL = { exact: 'Exact', road: 'Road', area: 'Town' };

// Foreign ownership: international lot + residential or building title is the only clear case.
export function foreigner(p) {
  if (p.bumiLot) return { k: 'no', label: 'Foreign buyers: no (Bumi or Malay Reserve lot)' };
  if (p.international && (p.titleType === 'residential' || p.titleType === 'building')) return { k: 'likely', label: 'Foreign buyers: likely (international lot, residential title)' };
  if (p.international) return { k: 'verify', label: 'Foreign buyers: check (international lot, but title not residential)' };
  const t = `${p.notes} ${p.tenure} ${p.title}`;
  if (/malay reserve|(?<!non[- ]?)\bbumi(putera)?\b|foreigners? not eligible/i.test(t)) return { k: 'no', label: 'Foreign buyers: no (per listing: Malay Reserve, Bumi or locals only)' };
  return { k: 'unknown', label: 'Foreign buyers: not stated' };
}

// ───────────── Combinations ─────────────
// Evidence, strongest first. We never know that two plots touch unless the seller says so or a lot
// plan shows it; everything below "seller" is a lead to check with the lot plan.
export const EVIDENCE = {
  seller: { rank: 0, label: 'Seller says adjoining', hint: 'The listing itself says the lots adjoin or are sold together.' },
  lot: { rank: 1, label: 'Lot numbers close', hint: 'Same mukim and lot numbers within a few of each other. Often neighbours, not always.' },
  road: { rank: 2, label: 'Same road or kampung', hint: 'Listed on the same road or in the same kampung. Could be next door or a kilometre apart.' },
  near: { rank: 3, label: 'Pins close together', hint: 'Map pins are close. Pins come from road or kampung names, so this is the weakest lead.' },
};
const norm = (s) => (s || '').toLowerCase().replace(/\b(jalan|jln|kampung|kg|taman|tmn|lorong|lrg)\b\.?/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
// Road/kampung key: the first place name, e.g. 'Ulu Choh, Pekan Nanas' → 'ulu choh'.
const placeKey = (s) => norm(String(s || '').split(/[,;(]/)[0]);
const lotNum = (s) => { const m = String(s || '').match(/(\d{2,})/); return m ? Number(m[1]) : null; };

export function edgesFor(list, { gapM = 400 } = {}) {
  const edges = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      let ev = null, why = '';
      if (a.groupHint && a.groupHint === b.groupHint) { ev = 'seller'; why = a.adjacent || b.adjacent || a.groupHint; }
      else if (a.mukim && norm(a.mukim) === norm(b.mukim) && lotNum(a.lotNo) && lotNum(b.lotNo) && Math.abs(lotNum(a.lotNo) - lotNum(b.lotNo)) <= 3) { ev = 'lot'; why = `${a.lotNo} and ${b.lotNo}, Mukim ${a.mukim}`; }
      else if (placeKey(a.locality) && placeKey(a.locality) === placeKey(b.locality)) { ev = 'road'; why = String(a.locality).split(/[,;(]/)[0].trim(); }
      else if (hasPin(a) && hasPin(b) && a.locPrecision !== 'area' && b.locPrecision !== 'area') {
        const d = km([a.lat, a.lng], [b.lat, b.lng]) * 1000;
        if (d <= gapM) { ev = 'near'; why = `${Math.round(d)} m apart`; }
      }
      if (ev) edges.push({ a: a.id, b: b.id, ev, why });
    }
  }
  return edges;
}

// Groups = connected sets of plots. A group is only as strong as its weakest link.
export function combinations(all, { targetAcres = 2, gapM = 400 } = {}) {
  const list = all.filter((p) => !p.dupOf); // a duplicate or package row would count the land twice
  const hintSize = {};
  list.forEach((p) => p.groupHint && (hintSize[p.groupHint] = (hintSize[p.groupHint] || 0) + 1));
  const edges = edgesFor(list, { gapM });
  const components = (use) => {
    const parent = new Map(list.map((p) => [p.id, p.id]));
    const find = (x) => (parent.get(x) === x ? x : (parent.set(x, find(parent.get(x))), parent.get(x)));
    use.forEach((e) => parent.set(find(e.a), find(e.b)));
    const sets = new Map();
    list.forEach((p) => { const r = find(p.id); if (!sets.has(r)) sets.set(r, []); sets.get(r).push(p); });
    return [...sets.values()].filter((m) => m.length > 1);
  };
  const make = (members, gEdges, evidence) => {
    const acres = members.reduce((s, m) => s + (m.acres || 0), 0);
    const priceRM = members.every((m) => m.priceRM != null) ? members.reduce((s, m) => s + m.priceRM, 0) : null;
    return {
      id: members.map((m) => m.id).sort().join('+'),
      members: [...members].sort((x, y) => (y.acres || 0) - (x.acres || 0)),
      edges: gEdges, evidence, acres, priceRM,
      psf: priceRM && acres ? priceRM / (acres * SQFT_PER_ACRE) : null,
      reaches: acres >= targetAcres,
    };
  };
  const groups = [];
  // 1. Sets the seller describes: always shown, whatever their size.
  const sellerEdges = edges.filter((e) => e.ev === 'seller');
  for (const m of components(sellerEdges)) {
    const ids = new Set(m.map((x) => x.id));
    groups.push(make(m, sellerEdges.filter((e) => ids.has(e.a)), 'seller'));
  }
  // 2. Leads: plots (or whole seller sets) joined by weaker evidence. Only worth showing when a
  //    small plot is involved: two big plots on one road aren't a combination question.
  for (const m of components(edges)) {
    const ids = new Set(m.map((x) => x.id));
    const lead = edges.filter((e) => ids.has(e.a) && e.ev !== 'seller');
    if (!lead.length || !m.some((x) => (x.acres ?? 0) < targetAcres)) continue;
    const weakest = lead.reduce((w, e) => (EVIDENCE[e.ev].rank > EVIDENCE[w].rank ? e.ev : w), lead[0].ev);
    groups.push(make(m, edges.filter((e) => ids.has(e.a)), weakest));
  }
  // Single listings that already bundle several lots.
  for (const p of list) {
    if (p.adjacent && (!p.groupHint || hintSize[p.groupHint] === 1)) {
      groups.push({ id: p.id, members: [p], edges: [], evidence: 'seller', acres: p.acres || 0, priceRM: p.priceRM, psf: psf(p), reaches: (p.acres || 0) >= targetAcres, bundle: true });
    }
  }
  return groups.sort((x, y) => EVIDENCE[x.evidence].rank - EVIDENCE[y.evidence].rank || Number(!!x.bundle) - Number(!!y.bundle) || Number(y.reaches) - Number(x.reaches) || (x.psf ?? 1e9) - (y.psf ?? 1e9));
}

export const memberOf = (groups) => {
  const m = new Map();
  groups.forEach((g) => g.members.forEach((p) => { if (!m.has(p.id)) m.set(p.id, g); }));
  return m;
};
export const distinct = plots.filter((p) => !p.dupOf);
