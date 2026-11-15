// MYR→SGD from allratestoday.com, the same provider and request as Gainsbridge
// (gainsbridge/netlify/lib/rates.js fetchRate). The key stays server-side (Netlify env
// ALLRATESTODAY_API_KEY). Netlify's CDN caches the answer for 6 hours, so visitors don't
// each spend an API call.
const PAIR = { from: 'MYR', to: 'SGD' };

const json = (body, status, cache) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json',
    'cache-control': cache ? 'public, max-age=1800' : 'no-store',
    ...(cache ? { 'netlify-cdn-cache-control': 'public, durable, s-maxage=21600, stale-while-revalidate=86400' } : {}),
  },
});

// The source's own time for a quote, as ISO, or null (ISO strings, or seconds/ms since 1970).
function quoteTime(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  const d = Number.isFinite(n) ? new Date(n < 1e12 ? n * 1000 : n) : new Date(String(v));
  const t = d.getTime();
  return Number.isFinite(t) && t > Date.UTC(2000, 0, 1) && t < Date.now() + 86400000 ? d.toISOString() : null;
}

export default async () => {
  const apiKey = process.env.ALLRATESTODAY_API_KEY;
  if (!apiKey) return json({ error: 'Live rate not configured (ALLRATESTODAY_API_KEY missing)' }, 503, false);
  try {
    const res = await fetch(`https://allratestoday.com/api/v1/rates?source=${PAIR.from}&target=${PAIR.to}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) return json({ error: `allratestoday.com: HTTP ${res.status}` }, 502, false);
    const body = await res.json();
    const first = Array.isArray(body) ? body[0] : body;
    const rate = Number(first?.rate ?? first?.data?.rate ?? first?.result ?? first?.value);
    if (!Number.isFinite(rate) || rate <= 0 || rate > 2) return json({ error: 'allratestoday.com: unexpected response' }, 502, false);
    return json({ ...PAIR, rate, quotedAt: quoteTime(first?.time ?? first?.date ?? first?.timestamp), fetchedAt: new Date().toISOString(), source: 'allratestoday.com' }, 200, true);
  } catch (e) {
    return json({ error: `allratestoday.com: ${e.message}` }, 502, false);
  }
};

export const config = { path: '/api/fx' };
