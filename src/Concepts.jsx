import { useState } from 'react';

const SETS = [
  { key: 'compact', label: 'Compact · up to 2.5 ac', items: [
    ['3d-driveway-compact.jpg', '3D compact with driveway', 'Paved driveway, covered carport for several cars, gate access.'],
    ['3d-compact.jpg', '3D compact model', 'Tight courtyard cluster: 4–5 connected pavilions and an elder suite.'],
    ['compact-2ac.jpg', 'Compact aerial', 'An efficient 2-acre layout.'],
  ] },
  { key: 'medium', label: 'Medium · 2.5–5.5 ac', items: [
    ['3d-driveway-medium.jpg', '3D medium with driveway', 'Courtyard cluster with a driveway loop and a parking bay.'],
    ['3d-medium.jpg', '3D medium model', '7 pavilions around a central hall and water feature.'],
    ['medium-4ac.jpg', 'Medium aerial', 'A generous courtyard cluster.'],
    ['aerial.jpg', 'Aerial context', 'How the cluster sits on the land, with security wall and garden.'],
  ] },
  { key: 'large', label: 'Large · over 5.5 ac', items: [
    ['3d-driveway-large.jpg', '3D large with driveway', 'Main driveway, parking court at the entrance, second parking by the elder pavilion.'],
    ['3d-large.jpg', '3D large model', 'Linear spine with room to grow and a separate elder pavilion.'],
    ['large-8ac.jpg', 'Large aerial', 'Orchards, recreation and a future growth area.'],
  ] },
  { key: 'shared', label: 'Every size', items: [
    ['3d-exploded.jpg', 'Pavilion, exploded', 'Roof, walls, rooms and tropical ventilation paths.'],
    ['driveway-detail.jpg', 'Entrance and carport', 'Gatehouse, paved approach, covered parking.'],
    ['interior.jpg', 'Communal living', 'Open-air central pavilion for shared meals.'],
    ['interior2.jpg', 'Covered dining', 'Timber hall opening to the garden.'],
    ['aerial2.jpg', 'Alternative aerial', 'Connected pavilions with a shared garden.'],
    ['size-comparison.jpg', 'Sizes compared', 'How the programme scales from 2 to 8 acres.'],
    ['plan.jpg', 'Plan', 'Early site plan.'],
    ['elevation.jpg', 'Elevation', 'Early elevation study.'],
  ] },
];

export default function Concepts() {
  const [zoom, setZoom] = useState(null);
  const [only, setOnly] = useState('all');
  return (
    <div className="stack">
      <section className="pagehead">
        <span className="eyebrow">Compound concepts</span>
        <h1>One household, several homes</h1>
        <p>Illustrations only, not designs: how connected pavilions could sit on plots of different sizes. Click any image to enlarge it.</p>
      </section>
      <div className="filters">
        {[['all', 'All'], ...SETS.map((s) => [s.key, s.label])].map(([k, l]) => <button key={k} className={only === k ? 'on' : ''} onClick={() => setOnly(k)}>{l}</button>)}
      </div>
      {SETS.filter((s) => only === 'all' || s.key === only).map((s) => (
        <section key={s.key} className="stack" style={{ gap: 10 }}>
          <h2>{s.label}</h2>
          <div className="concept-grid">
            {s.items.map(([f, t, d]) => (
              <figure key={f} className="concept-card" style={{ margin: 0 }}>
                <img src={`/concepts/${f}`} alt={t} loading="lazy" onClick={() => setZoom(`/concepts/${f}`)} />
                <div><h3>{t}</h3><p>{d}</p></div>
              </figure>
            ))}
          </div>
        </section>
      ))}
      {zoom && <div className="zoom" onClick={() => setZoom(null)} role="dialog" aria-label="Enlarged image"><img src={zoom} alt="" /></div>}
    </div>
  );
}
