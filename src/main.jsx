import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App.jsx';
import './styles.css';

// Debug: write something immediately
document.body.insertAdjacentHTML('afterbegin', '<div id="debug-banner" style="background:#c0392b;color:white;padding:4px;font-size:12px;">JS loaded</div>');

try {
  createRoot(document.getElementById('root')).render(<App />);
} catch (e) {
  document.getElementById('root').innerHTML = '<pre style="color:red;padding:20px">' + e.message + '\\n' + e.stack + '</pre>';
}
