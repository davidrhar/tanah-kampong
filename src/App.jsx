import { useState } from 'react';
import MapView from './MapView.jsx';
import { listings, toSGD, haversine, SECOND_LINK, CAUSEWAY } from './listings.js';

export default function App() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="app">
      <div className="map-container">
        <MapView selectedId={selected?.id} onSelect={setSelected} />
      </div>
      <div className="bottom">
        <div className="list-panel">
          <h1>Land Candidates (2+ acres)</h1>
          <p className="rate-note">Prices in SGD (rate: 1 MYR = 0.3155 SGD, 9 Nov 2026). Original RM in parentheses. Click a listing for full details.</p>
          <div id="listings">
            {listings.map(l => {
              const distSL = haversine(l.lat, l.lng, SECOND_LINK[0], SECOND_LINK[1]);
              const distCW = haversine(l.lat, l.lng, CAUSEWAY[0], CAUSEWAY[1]);
              return (
                <div
                  key={l.id}
                  className={`listing ${selected?.id === l.id ? 'active' : ''}`}
                  onClick={() => setSelected(l)}
                >
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
          {selected ? (
            <Detail listing={selected} />
          ) : (
            <div className="placeholder">Select a listing on the left or click a polygon on the map to see full details here.</div>
          )}
        </div>
      </div>
    </div>
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
