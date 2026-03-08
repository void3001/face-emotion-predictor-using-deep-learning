import { useState, useCallback } from 'react';
import FaceCanvas from './components/FaceCanvas';
import InfoPanel from './components/InfoPanel';
import './App.css';

export default function App() {
  const [detection, setDetection] = useState(null);

  const handleDetection = useCallback((data) => {
    setDetection(data);
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-logo">
          <span className="logo-icon">🧬</span>
          <div className="header-text">
            <h1 className="header-title">FaceRead AI</h1>
            <p className="header-sub">Real-Time Face Shape & Emotion Analyzer</p>
          </div>
        </div>
        <div className="header-badge">
          <span className="pulse-dot" />
          LIVE
        </div>
      </header>

      {/* Main content */}
      <main className="app-main">
        {/* Camera feed */}
        <section className="camera-section">
          <div className="camera-frame">
            <div className="camera-glow" />
            <FaceCanvas onDetection={handleDetection} />
          </div>
          <p className="camera-hint">📷 Allow camera access when prompted • Best in good lighting</p>
        </section>

        {/* Side panel */}
        <aside className="side-panel">
          <InfoPanel detection={detection} />
        </aside>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <span>Powered by <strong>face-api.js</strong> · Runs entirely in your browser · No data is uploaded</span>
      </footer>
    </div>
  );
}
