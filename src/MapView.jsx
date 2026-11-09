import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { listings, approxPolygon, SECOND_LINK, CAUSEWAY } from './listings.js';

export default function MapView({ selectedId, onSelect }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layersRef = useRef({});

  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current).setView([1.45, 103.65], 11);
    L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_5527_1_bbe84fe6a8c0a421077a59a4', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 20
    }).addTo(map);

    L.marker(SECOND_LINK, {
      icon: L.divIcon({
        className: 'ciq-marker',
        html: '<div style="background:#c0392b;color:white;padding:2px 6px;border-radius:4px;font-size:11px;white-space:nowrap;">2nd Link CIQ</div>',
        iconSize: [80, 20]
      })
    }).addTo(map);

    L.marker(CAUSEWAY, {
      icon: L.divIcon({
        className: 'ciq-marker',
        html: '<div style="background:#c0392b;color:white;padding:2px 6px;border-radius:4px;font-size:11px;white-space:nowrap;">Causeway CIQ</div>',
        iconSize: [90, 20]
      })
    }).addTo(map);

    const layers = {};
    listings.forEach(l => {
      const acres = parseFloat(l.size) || 2;
      const poly = L.polygon(approxPolygon(l.lat, l.lng, acres), {
        color: l.color, fillColor: l.color, fillOpacity: 0.25, weight: 2
      }).addTo(map);
      poly.on('click', () => onSelect(l));

      const marker = L.circleMarker([l.lat, l.lng], {
        radius: 8, fillColor: l.color, color: '#fff', weight: 2, fillOpacity: 0.95
      }).addTo(map);
      marker.on('click', () => onSelect(l));

      layers[l.id] = { poly, marker };
    });

    layersRef.current = layers;
    mapInstance.current = map;

    const group = L.featureGroup([...Object.values(layers).flatMap(x => [x.marker, x.poly])]);
    map.fitBounds(group.getBounds().pad(0.15));

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [onSelect]);

  useEffect(() => {
    if (!mapInstance.current || !selectedId) return;
    const layer = layersRef.current[selectedId];
    if (layer) {
      mapInstance.current.setView([layer.marker.getLatLng().lat, layer.marker.getLatLng().lng], 14);
    }
  }, [selectedId]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
}
