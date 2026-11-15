// Map of the plots: pins coloured by zoning and sized by acreage. A dashed hollow pin means we only
// know the town. Lines join plots that could be combined, coloured by how good the evidence is.
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LANDMARKS, SQM_PER_ACRE, hasPin, fmtAcres, fmtRM } from './model.js';

export const ZONE_COLOUR = { residential: '#1f8a4c', agricultural: '#d08a16', industrial: '#4b6b8a', commercial: '#6a4fc2', mixed: '#6a4fc2', unknown: '#7d8b96' };
export const EV_COLOUR = { seller: '#1f8a4c', lot: '#146c4f', road: '#d08a16', near: '#4b6b8a' };

const CARTO_KEY = 'cb1_5527_1_bbe84fe6a8c0a421077a59a4';
const dark = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
const sizePx = (a) => Math.round(Math.min(30, 11 + Math.sqrt(a || 1) * 3.2));

// Many pins share a town or kampung centre. Spread a stack in a small ring so each can be clicked;
// these pins are approximate anyway and are drawn hollow.
function spread(plots) {
  const stacks = new Map();
  plots.filter(hasPin).forEach((p) => { const k = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`; if (!stacks.has(k)) stacks.set(k, []); stacks.get(k).push(p); });
  const out = new Map();
  for (const st of stacks.values()) {
    st.forEach((p, i) => {
      if (st.length === 1) return out.set(p.id, [p.lat, p.lng]);
      const r = (180 + 25 * st.length) / 111320, a = (2 * Math.PI * i) / st.length;
      out.set(p.id, [p.lat + r * Math.sin(a), p.lng + (r * Math.cos(a)) / Math.cos((p.lat * Math.PI) / 180)]);
    });
  }
  return out;
}

export default function MapView({ plots, groups, selectedId, focusGroupId, showLinks, onSelect }) {
  const el = useRef(null);
  const mapRef = useRef(null);
  const layer = useRef(null);
  const links = useRef(null);
  const markers = useRef(new Map());
  const fitted = useRef(false);

  useEffect(() => {
    const map = L.map(el.current, { scrollWheelZoom: false, zoomControl: true, preferCanvas: false }).setView([1.45, 103.68], 11);
    // CARTO now needs a key; this is the project's public client key (it was already in the original map code).
    L.tileLayer(`https://basemaps.cartocdn.com/rastertiles/${dark() ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`, {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors · © <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    }).addTo(map);
    LANDMARKS.forEach((l) => L.marker(l.at, { icon: L.divIcon({ className: '', html: `<span class="ciq">${l.short}</span>`, iconSize: [0, 0] }), interactive: false, zIndexOffset: -100 }).addTo(map));
    layer.current = L.layerGroup().addTo(map);
    links.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 80);
    return () => { clearTimeout(t); map.remove(); mapRef.current = null; };
  }, []);

  // Pins
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    layer.current.clearLayers(); markers.current.clear();
    const pts = [];
    const at = spread(plots);
    for (const p of plots) {
      if (!hasPin(p)) continue;
      const [lat, lng] = at.get(p.id);
      const c = ZONE_COLOUR[p.zoning] || ZONE_COLOUR.unknown;
      const s = sizePx(p.acres);
      const cls = `mk ${p.locPrecision === 'area' ? 'area' : ''} ${p.id === selectedId ? 'on' : ''}`;
      const m = L.marker([lat, lng], {
        icon: L.divIcon({ className: '', html: `<div class="${cls}" style="width:${s}px;height:${s}px;background:${c};border-color:${p.locPrecision === 'area' ? c : '#fff'}"></div>`, iconSize: [s, s], iconAnchor: [s / 2, s / 2] }),
        zIndexOffset: p.id === selectedId ? 1000 : 0, keyboard: true, title: p.title,
      });
      m.bindTooltip(`<b>${p.title}</b><br>${fmtAcres(p.acres)} · ${fmtRM(p.priceRM)}`, { direction: 'top', offset: [0, -s / 2] });
      m.on('click', () => onSelect(p.id));
      m.addTo(layer.current); markers.current.set(p.id, m); pts.push([lat, lng]);
      // Real footprint at the right size when the pin is exact (shape is not known: a circle of equal area).
      if (p.locPrecision === 'exact' && p.acres) L.circle([p.lat, p.lng], { radius: Math.sqrt((p.acres * SQM_PER_ACRE) / Math.PI), color: c, weight: 1, fillOpacity: 0.12, interactive: false }).addTo(layer.current);
    }
    if (!fitted.current && pts.length) { map.fitBounds(L.latLngBounds(pts).pad(0.08)); fitted.current = true; }
  }, [plots, selectedId, onSelect]);

  // Combination links
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    links.current.clearLayers();
    const byId = new Map(plots.map((p) => [p.id, p]));
    const at = spread(plots);
    const show = groups.filter((g) => (focusGroupId ? g.id === focusGroupId : showLinks));
    for (const g of show) {
      for (const e of g.edges) {
        const a = byId.get(e.a), b = byId.get(e.b);
        if (!a || !b || !hasPin(a) || !hasPin(b)) continue;
        L.polyline([at.get(a.id), at.get(b.id)], { color: EV_COLOUR[e.ev], weight: focusGroupId ? 4 : 2.5, opacity: 0.85, dashArray: e.ev === 'seller' ? null : '6 6', interactive: false }).addTo(links.current);
      }
    }
    if (focusGroupId) {
      const g = groups.find((x) => x.id === focusGroupId);
      const pts = g?.members.filter((p) => at.has(p.id)).map((p) => at.get(p.id)) || [];
      if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.6), { maxZoom: 15 });
    }
  }, [groups, plots, focusGroupId, showLinks]);

  // Pan to the selected plot
  useEffect(() => {
    const m = markers.current.get(selectedId);
    if (m && mapRef.current) mapRef.current.setView(m.getLatLng(), Math.max(mapRef.current.getZoom(), 13), { animate: true });
  }, [selectedId]);

  return <div ref={el} className="map" />;
}
