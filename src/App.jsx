import React, { useState, Component, useMemo } from 'react';
import MapView from './MapView.jsx';
import { listings, toSGD, haversine, SECOND_LINK, CAUSEWAY } from './listings.js';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return <div style={{padding:20}}><h2>Error</h2><pre>{String(this.state.error)}</pre></div>;
    }
    return this.props.children;
  }
}

export default function App() {
  const [tab, setTab] = useState('map');
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState('size');
  const [sortDir, setSortDir] = useState('desc');
  const [minAcres, setMinAcres] = useState(0);
  const [residentialOnly, setResidentialOnly] = useState(false);
  const [mockupFor, setMockupFor] = useState(null);
  const [fullGallery, setFullGallery] = useState(false);
  const [zoomSrc, setZoomSrc] = useState(null);

  const sortedListings = useMemo(() => {
    let arr = listings.filter(l => {
      const acres = parseFloat(l.size) || 0;
      if (acres < minAcres) return false;
      if (residentialOnly && !/residential/i.test(l.zoning || '')) return false;
      return true;
    });
    const parsePsf = s => parseFloat(String(s).replace(/[^0-9.]/g, '')) || 0;
    const parsePrice = s => parseFloat(String(s).replace(/[^0-9.]/g, '')) || 0;
    arr.sort((a, b) => {
      let va, vb;
      if (sortBy === 'size') { va = parseFloat(a.size) || 0; vb = parseFloat(b.size) || 0; }
      else if (sortBy === 'psf') { va = parsePsf(a.psf); vb = parsePsf(b.psf); }
      else if (sortBy === 'price') { va = parsePrice(a.price); vb = parsePrice(b.price); }
      else if (sortBy === 'distSL') { va = parseFloat(haversine(a.lat, a.lng, SECOND_LINK[0], SECOND_LINK[1])); vb = parseFloat(haversine(b.lat, b.lng, SECOND_LINK[0], SECOND_LINK[1])); }
      else if (sortBy === 'distCW') { va = parseFloat(haversine(a.lat, a.lng, CAUSEWAY[0], CAUSEWAY[1])); vb = parseFloat(haversine(b.lat, b.lng, CAUSEWAY[0], CAUSEWAY[1])); }
      else { va = 0; vb = 0; }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [sortBy, sortDir, minAcres, residentialOnly]);

  return (
    <ErrorBoundary>
      <div className="app">
        <div className="tabs">
          <button className={tab === 'map' ? 'active' : ''} onClick={() => setTab('map')}>Map & Listings ({listings.length})</button>
          <button className={tab === 'concepts' ? 'active' : ''} onClick={() => setTab('concepts')}>Compound Concepts</button>
        </div>
        {tab === 'map' ? (
          <>
            <div className="map-container">
              <MapView selectedId={selected?.id} onSelect={setSelected} onDoubleClick={setMockupFor} />
            </div>
            <div className="bottom">
              <div className="list-panel">
                <h1>Land Candidates (2+ acres)</h1>
                <p className="rate-note">Prices in SGD (rate: 1 MYR = 0.3155 SGD). Original RM in parentheses. Click a listing for details. Double-click for size-specific concepts. Non-locals: prefer residential-zoned / international lots (RM1M+ with state consent). Agricultural titles restricted.</p>
                
                <div className="filters">
                  <label>
                    Sort
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                      <option value="size">Land size</option>
                      <option value="psf">PSF (RM)</option>
                      <option value="price">Total price</option>
                      <option value="distSL">Distance to 2nd Link</option>
                      <option value="distCW">Distance to Causeway</option>
                    </select>
                  </label>
                  <label>
                    Order
                    <select value={sortDir} onChange={e => setSortDir(e.target.value)}>
                      <option value="desc">Largest / highest first</option>
                      <option value="asc">Smallest / lowest first</option>
                    </select>
                  </label>
                  <label>
                    Min acres
                    <input type="number" min="0" step="0.5" value={minAcres} onChange={e => setMinAcres(parseFloat(e.target.value) || 0)} style={{width:60}} />
                  </label>
                  <label className="chk">
                    <input type="checkbox" checked={residentialOnly} onChange={e => setResidentialOnly(e.target.checked)} />
                    Residential only
                  </label>
                </div>

                <div id="listings">
                  {sortedListings.map(l => {
                    const distSL = haversine(l.lat, l.lng, SECOND_LINK[0], SECOND_LINK[1]);
                    const distCW = haversine(l.lat, l.lng, CAUSEWAY[0], CAUSEWAY[1]);
                    return (
                      <div key={l.id} className={`listing ${selected?.id === l.id ? 'active' : ''}`} onClick={() => setSelected(l)} onDoubleClick={() => setMockupFor(l)}>
                        <h3>{l.name}</h3>
                        <div className="meta"><span className="size">{l.size}</span> · <span className="price">{toSGD(l.price)} ({l.price})</span></div>
                        <div className="meta">{l.zoning} · {l.tenure}</div>
                        <div className="dist">2nd Link: {distSL} km · Causeway: {distCW} km</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="detail-panel">
                {selected ? <Detail listing={selected} /> : <div className="placeholder">Select a listing or click a polygon on the map.</div>}
              </div>
            </div>
          </>
        ) : (
          <Concepts onOpenGallery={() => setFullGallery(true)} />
        )}
      </div>

      {mockupFor && (
        <div className="modal-overlay" onClick={() => setMockupFor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setMockupFor(null)}>×</button>
            <h2>Concepts for {mockupFor.name}</h2>
            <p className="rate-note">Limited to this plot’s size ({mockupFor.size}). Click any image to zoom.</p>
            <SizeAwareMockups size={mockupFor.size} onZoom={setZoomSrc} />
          </div>
        </div>
      )}
      {fullGallery && (
        <div className="modal-overlay" onClick={() => setFullGallery(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setFullGallery(false)}>×</button>
            <h2>Full Compound Concepts</h2>
            <p className="rate-note">All sizes and views. Click any image to zoom in. Double-click cards on the Concepts tab to open this.</p>
            <FullGallery onZoom={setZoomSrc} />
          </div>
        </div>
      )}
      {zoomSrc && (
        <div className="zoom-overlay" onClick={() => setZoomSrc(null)}>
          <img src={zoomSrc} alt="Zoomed concept" onClick={e => e.stopPropagation()} />
          <button className="zoom-close" onClick={() => setZoomSrc(null)}>×</button>
          <p className="zoom-hint">Click outside or × to close</p>
        </div>
      )}
    </ErrorBoundary>
  );
}

function Detail({ listing: l }) {
  const distSL = haversine(l.lat, l.lng, SECOND_LINK[0], SECOND_LINK[1]);
  const distCW = haversine(l.lat, l.lng, CAUSEWAY[0], CAUSEWAY[1]);
  return (
    <>
      <h2>{l.name}</h2>
      <div className="section"><span className="label">Size:</span> <span className="size">{l.size}</span></div>
      <div className="section"><span className="label">Price:</span> <span className="price">{toSGD(l.price)} ({l.price})</span> · {l.psf} psf</div>
      <div className="section"><span className="label">Tenure:</span> {l.tenure}</div>
      <div className="section"><span className="label">Zoning:</span> {l.zoning}</div>
      <div className="section"><span className="label">Utilities:</span> {l.utilities}</div>
      <div className="section"><span className="label">Distance to 2nd Link CIQ:</span> {distSL} km</div>
      <div className="section"><span className="label">Distance to Causeway CIQ:</span> {distCW} km</div>
      <div className="section"><span className="label">Notes:</span> {l.notes}</div>
      <a className="btn" href={l.link} target="_blank" rel="noreferrer">View original listing →</a>
    </>
  );
}

function Concepts({ onOpenGallery }) {
  return (
    <div className="concepts">
      <h1>Multi-generational Compound Concepts</h1>
      <p>Illustrative concepts for a connected single-household compound. Double-click any card (or the button below) to open the full gallery and zoom in.</p>
      <button className="btn" style={{marginBottom:16}} onClick={onOpenGallery}>Open full gallery</button>
      <div className="concept-grid" onDoubleClick={onOpenGallery}>
        <div className="concept-card">
          <img src="/concepts/3d-medium.jpg" alt="3D Medium" />
          <h3>3D Courtyard Model</h3>
          <p>Isometric 3D visualization of the connected pavilion cluster with central hall and garden.</p>
        </div>
        <div className="concept-card">
          <img src="/concepts/3d-exploded.jpg" alt="3D Exploded" />
          <h3>3D Pavilion Exploded</h3>
          <p>Structural 3D diagram showing roof, walls, rooms and tropical ventilation paths.</p>
        </div>
        <div className="concept-card">
          <img src="/concepts/3d-large.jpg" alt="3D Large" />
          <h3>3D Large Layout</h3>
          <p>Linear spine model for larger plots with expansion space and separate elder pavilion.</p>
        </div>
      </div>
    </div>
  );
}

function sizeCategory(sizeStr) {
  const n = parseFloat(sizeStr) || 2;
  if (n <= 2.5) return 'compact';
  if (n <= 5.5) return 'medium';
  return 'large';
}

function SizeAwareMockups({ size, onZoom }) {
  const cat = sizeCategory(size);
  const sets = {
    compact: [
      { src: '/concepts/3d-driveway-compact.jpg', title: '3D Compact with Driveway & Parking', desc: 'Isometric view showing paved driveway, covered carport for several cars, and gate access.' },
      { src: '/concepts/3d-compact.jpg', title: '3D Compact Model (≤2.5 ac)', desc: 'Isometric 3D view of tight courtyard cluster — 4–5 connected pavilions + elder suite.' },
      { src: '/concepts/3d-exploded.jpg', title: '3D Pavilion Exploded', desc: 'How a single tropical pavilion is structured: roof, walls, rooms, ventilation.' },
      { src: '/concepts/interior2.jpg', title: 'Shared covered hall', desc: 'Central dining that keeps the compound feeling like one household.' },
    ],
    medium: [
      { src: '/concepts/3d-driveway-medium.jpg', title: '3D Medium with Driveway & Parking', desc: 'Courtyard cluster with driveway loop and dedicated parking bay under carport.' },
      { src: '/concepts/3d-medium.jpg', title: '3D Medium Model (4–5 ac)', desc: 'Isometric 3D view of 7 pavilions + central hall and water feature.' },
      { src: '/concepts/3d-exploded.jpg', title: '3D Pavilion Exploded', desc: 'Structural layers of a multi-generational tropical pavilion.' },
      { src: '/concepts/aerial.jpg', title: 'Aerial context', desc: 'How the 3D cluster sits on the land with security wall and garden.' },
      { src: '/concepts/interior.jpg', title: 'Communal living', desc: 'Open-air central pavilion for shared meals.' },
    ],
    large: [
      { src: '/concepts/3d-driveway-large.jpg', title: '3D Large with Driveway & Parking', desc: 'Linear spine with main driveway, parking court near entrance, and secondary parking by elder pavilion.' },
      { src: '/concepts/3d-large.jpg', title: '3D Large Model (8 ac)', desc: 'Isometric 3D view of linear spine with expansion space and elder pavilion.' },
      { src: '/concepts/3d-exploded.jpg', title: '3D Pavilion Exploded', desc: 'How individual pavilions are built and ventilated.' },
      { src: '/concepts/large-8ac.jpg', title: 'Aerial of large layout', desc: 'Spacious site with orchards, recreation, and future growth area.' },
    ],
  };
  const items = sets[cat] || sets.medium;
  return (
    <div className="concept-grid">
      {items.map((it, i) => (
        <div key={i} className="concept-card">
          <img src={it.src} alt={it.title} onClick={() => onZoom?.(it.src)} style={{cursor:'zoom-in'}} />
          <h3>{it.title}</h3>
          <p>{it.desc}</p>
        </div>
      ))}
      <div className="concept-card" style={{ background: '#f8f9fa' }}>
        <img src="/concepts/3d-exploded.jpg" alt="3D Exploded" />
        <h3>All sizes compared</h3>
        <p>Compact (≤2.5 ac), Medium (2.5–5.5 ac), Large (>5.5 ac). Layouts stay linked so the compound reads as one household.</p>
      </div>
    </div>
  );
}

function FullGallery({ onZoom }) {
  const all = [
    { src: '/concepts/3d-compact.jpg', title: '3D Compact (≤2.5 ac)', desc: 'Tight courtyard cluster for smaller plots.' },
    { src: '/concepts/3d-medium.jpg', title: '3D Medium (4–5 ac)', desc: '7-pavilion courtyard with central hall.' },
    { src: '/concepts/3d-large.jpg', title: '3D Large (8 ac)', desc: 'Linear spine with expansion space.' },
    { src: '/concepts/3d-exploded.jpg', title: '3D Pavilion Exploded', desc: 'Structure, rooms and ventilation.' },
    { src: '/concepts/3d-driveway-compact.jpg', title: 'Driveway & Parking (Compact)', desc: 'Covered carport and access road.' },
    { src: '/concepts/3d-driveway-medium.jpg', title: 'Driveway & Parking (Medium)', desc: 'Driveway loop with dedicated parking bay.' },
    { src: '/concepts/3d-driveway-large.jpg', title: 'Driveway & Parking (Large)', desc: 'Main driveway and parking court.' },
    { src: '/concepts/driveway-detail.jpg', title: 'Entrance & Carport Detail', desc: 'Gatehouse, paved approach, covered parking.' },
    { src: '/concepts/aerial.jpg', title: 'Aerial courtyard', desc: 'How the cluster sits on the land.' },
    { src: '/concepts/aerial2.jpg', title: 'Alternative aerial', desc: 'Connected pavilions with shared garden.' },
    { src: '/concepts/interior.jpg', title: 'Communal living', desc: 'Open-air central pavilion.' },
    { src: '/concepts/interior2.jpg', title: 'Covered dining', desc: 'Timber hall opening to garden.' },
    { src: '/concepts/compact-2ac.jpg', title: 'Compact aerial', desc: 'Efficient 2-acre layout.' },
    { src: '/concepts/medium-4ac.jpg', title: 'Medium aerial', desc: 'Generous courtyard cluster.' },
    { src: '/concepts/large-8ac.jpg', title: 'Large aerial', desc: 'Spacious linear layout.' },
    { src: '/concepts/size-comparison.jpg', title: 'Size comparison', desc: 'How the programme scales.' },
  ];
  return (
    <div className="concept-grid">
      {all.map((it, i) => (
        <div key={i} className="concept-card">
          <img src={it.src} alt={it.title} onClick={() => onZoom?.(it.src)} style={{cursor:'zoom-in'}} />
          <h3>{it.title}</h3>
          <p>{it.desc}</p>
        </div>
      ))}
    </div>
  );
}
