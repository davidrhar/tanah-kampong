import { useState, Component } from 'react';
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
              <MapView selectedId={selected?.id} onSelect={setSelected} />
            </div>
            <div className="bottom">
              <div className="list-panel">
                <h1>Land Candidates (2+ acres)</h1>
                <p className="rate-note">Prices in SGD (rate: 1 MYR = 0.3155 SGD). Original RM in parentheses. Click a listing for details.</p>
                <div id="listings">
                  {listings.map(l => {
                    const distSL = haversine(l.lat, l.lng, SECOND_LINK[0], SECOND_LINK[1]);
                    const distCW = haversine(l.lat, l.lng, CAUSEWAY[0], CAUSEWAY[1]);
                    return (
                      <div key={l.id} className={`listing ${selected?.id === l.id ? 'active' : ''}`} onClick={() => setSelected(l)}>
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
          <Concepts />
        )}
      </div>
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

function Concepts() {
  return (
    <div className="concepts">
      <h1>Multi-generational Compound Concepts</h1>
      <p>Illustrative concepts for a connected single-household compound holding 7+ families plus a dedicated elder/caretaker unit.</p>
      <div className="concept-grid">
        <div className="concept-card">
          <img src="/concepts/aerial.jpg" alt="Aerial" />
          <h3>Courtyard Cluster (Aerial)</h3>
          <p>7 private family pavilions around a central shared garden. Covered walkways connect everything. Ground-floor elder suite.</p>
        </div>
        <div className="concept-card">
          <img src="/concepts/plan.jpg" alt="Plan" />
          <h3>Site Plan & Layout</h3>
          <p>Top-down and isometric views of private wings, communal kitchen/living, and elder/caretaker suite.</p>
        </div>
        <div className="concept-card">
          <img src="/concepts/interior.jpg" alt="Interior" />
          <h3>Communal Living</h3>
          <p>Open-air central pavilion for shared meals. Individual suites open onto covered corridors.</p>
        </div>
      </div>
    </div>
  );
}
