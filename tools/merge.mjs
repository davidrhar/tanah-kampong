// Merge research batches into data/plots.json.
//   node tools/merge.mjs <batch.json>... [--prefix W]
// Each batch file is a JSON array in the plot schema (see README). The existing plots stay; new items
// get ids from their file name's first letter (west.json → W01…). Rows with the same listing URL are
// merged; rows with the same size and price are kept but marked as possible duplicates (dupOf).
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'data/plots.json';
const ENUM = {
  zoning: ['residential', 'agricultural', 'industrial', 'commercial', 'mixed', 'unknown'],
  titleType: ['agricultural', 'residential', 'industrial', 'commercial', 'building', 'unknown'],
  locPrecision: ['exact', 'road', 'area'],
  urlKind: ['listing', 'search'],
};
const FIELDS = ['title', 'locality', 'mukim', 'district', 'acres', 'priceRM', 'psfRM', 'tenure', 'titleType', 'zoning', 'international', 'bumiLot', 'lotNo', 'lat', 'lng', 'locPrecision', 'adjacent', 'groupHint', 'frontage', 'utilities', 'notes', 'source', 'url', 'urlKind', 'seen', 'listedDate', 'batch', 'dupOf', 'package'];

const urlKey = (u) => (u || '').replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/$/, '').replace('/bm/senarai-hartanah/', '/property-listing/').toLowerCase();
const close = (a, b, tol) => a != null && b != null && Math.abs(a - b) <= tol * Math.max(a, b);

function clean(r, batch) {
  const o = {};
  for (const k of FIELDS) o[k] = r[k] ?? null;
  for (const k of ['acres', 'priceRM', 'psfRM', 'lat', 'lng']) if (o[k] != null) { o[k] = Number(o[k]); if (!Number.isFinite(o[k]) || o[k] <= 0) o[k] = null; }
  for (const [k, vals] of Object.entries(ENUM)) if (!vals.includes(o[k])) o[k] = k === 'urlKind' ? 'listing' : k === 'locPrecision' ? 'area' : 'unknown';
  if (o.lat != null && (o.lat < 1.2 || o.lat > 2.2 || o.lng < 103.2 || o.lng > 104.4)) { o.lat = o.lng = null; }
  if (o.lat == null) o.locPrecision = 'area';
  if (o.priceRM != null && o.priceRM < 1000) o.priceRM = Math.round(o.priceRM * 1e6); // given in millions
  if (o.psfRM == null && o.priceRM && o.acres) o.psfRM = Math.round((o.priceRM / (o.acres * 43560)) * 10) / 10;
  if (typeof o.international !== 'boolean') o.international = null;
  if (typeof o.bumiLot !== 'boolean') o.bumiLot = null;
  o.batch = o.batch || batch;
  o.title = (o.title || 'Untitled plot').slice(0, 80);
  return o;
}

const plots = JSON.parse(fs.readFileSync(OUT, 'utf8'));
const byUrl = new Map(plots.map((p) => [urlKey(p.url), p]));
let added = 0, merged = 0, flagged = 0, skipped = 0;
for (const file of process.argv.slice(2).filter((a) => !a.startsWith('--'))) {
  const batch = path.basename(file, '.json');
  const prefix = batch[0].toUpperCase();
  let n = plots.filter((p) => p.id.startsWith(prefix) && /^\D\d+$/.test(p.id)).length;
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const raw of rows) {
    const r = clean(raw, batch);
    if (!r.url) { skipped++; continue; }
    // One listing URL can carry several lots. Same URL + same size = the same row (fill gaps only).
    // Same URL + size equal to the lots' sum = the package view of rows we already hold (skip).
    // Same URL + another size = another lot of that listing (keep).
    // Rows from the same batch with one URL are distinct lots by construction; only dedupe across batches.
    const siblings = plots.filter((p) => urlKey(p.url) === urlKey(r.url));
    const others = siblings.filter((p) => p.batch !== batch);
    const same = others.find((p) => close(p.acres, r.acres, 0.005) || p.acres == null || r.acres == null);
    if (same && (others.length === 1 || close(same.acres, r.acres, 0.005))) {
      for (const k of FIELDS) if (same[k] == null && r[k] != null) same[k] = r[k];
      merged++; continue;
    }
    if (siblings.length > 1 && close(siblings.reduce((s, p) => s + (p.acres || 0), 0), r.acres, 0.03)) { merged++; continue; }
    if (r.urlKind === 'listing' && siblings.length && (r.adjacent || siblings.some((p) => p.adjacent))) {
      const hint = siblings.find((p) => p.groupHint)?.groupHint || `listing ${urlKey(r.url)}`;
      siblings.forEach((p) => (p.groupHint ||= hint));
      r.groupHint ||= hint;
    }
    r.id = `${prefix}${String(++n).padStart(2, '0')}`;
    const twin = plots.find((p) => !(r.groupHint && p.groupHint === r.groupHint) && !(p.batch === batch && urlKey(p.url) === urlKey(r.url)) && close(p.acres, r.acres, 0.015) && close(p.priceRM, r.priceRM, 0.015));
    if (twin) { r.dupOf = twin.dupOf || twin.id; flagged++; }
    plots.push(r); byUrl.set(urlKey(r.url), r); added++;
  }
}
// A row whose size is the sum of the rest of its set is the whole package, listed by another agent:
// keep it for its link but mark it so totals don't count the land twice.
const sets = {};
plots.forEach((p) => p.groupHint && (sets[p.groupHint] ||= []).push(p));
for (const m of Object.values(sets)) {
  if (m.length < 3) continue;
  for (const p of m) {
    const rest = m.filter((x) => x !== p && !x.dupOf);
    if (rest.length >= 2 && close(rest.reduce((s, x) => s + (x.acres || 0), 0), p.acres, 0.03)) { p.dupOf = rest[0].id; p.package = true; }
  }
}
// Hand corrections (data/overrides.json), applied last so a re-merge keeps them.
const ov = fs.existsSync('data/overrides.json') ? JSON.parse(fs.readFileSync('data/overrides.json', 'utf8')) : {};
for (const [id, patch] of Object.entries(ov)) {
  const p = plots.find((x) => x.id === id); if (!p) continue;
  for (const [k, v] of Object.entries(patch)) if (!k.startsWith('_')) p[k] = v;
}
// Order fields consistently.
const out = plots.map((p) => Object.fromEntries(['id', ...FIELDS].map((k) => [k, p[k] ?? null])));
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(`plots ${out.length}: +${added} new, ${merged} merged into existing, ${flagged} possible duplicates, ${skipped} without url`);
