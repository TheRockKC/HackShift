import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, RefreshCw, Database, Server, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const { apiUrl, updateApiUrl, backendStatus, pingBackend, showToast } = useApp();
  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setTesting(true);
    try {
      updateApiUrl(inputUrl);
      showToast('API URL configuration updated!', 'success');
      onClose();
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    setInputUrl('http://localhost:8000');
    updateApiUrl('http://localhost:8000');
    showToast('Reset API URL to default localhost:8000', 'info');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window">
        <div className="modal-header">
          <div className="modal-title-flex">
            <Settings size={20} />
            <h3>AnnData Connection & API Settings</h3>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label>FastAPI Backend Base URL</label>
              <input
                type="text"
                placeholder="http://localhost:8000"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
              />
              <p className="subtext">
                Leave as <code>http://localhost:8000</code> when running locally with the FastAPI uvicorn server.
              </p>
            </div>

            <div className="status-overview-card">
              <div className="status-overview-header">
                <Server size={16} />
                <strong>Backend Health Check</strong>
              </div>

              <div className="status-overview-grid">
                <div className="status-row">
                  <span>API Connection:</span>
                  {backendStatus.online ? (
                    <span className="text-success font-bold flex-align">
                      <CheckCircle2 size={14} /> Connected
                    </span>
                  ) : (
                    <span className="text-danger font-bold flex-align">
                      <AlertTriangle size={14} /> Offline / Connecting
                    </span>
                  )}
                </div>

                {backendStatus.details?.database && (
                  <>
                    <div className="status-row">
                      <span>Database Engine:</span>
                      <span className="font-mono">{backendStatus.details.database.status}</span>
                    </div>
                    <div className="status-row">
                      <span>Neon Branch:</span>
                      <span className="font-mono">{backendStatus.details.database.branch}</span>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm btn-block mt-2"
                onClick={pingBackend}
              >
                <RefreshCw size={14} className={backendStatus.checking ? 'spin' : ''} />
                <span>Re-ping Health Endpoint</span>
              </button>
            </div>

            <div className="prototype-security-notice">
              <div className="notice-header">
                <ShieldAlert size={16} className="text-amber" />
                <strong>Prototype Authentication Notice</strong>
              </div>
              <p>
                In this hackathon build, role authorization is verified against the <code>users</code> table
                by passing explicit User IDs (e.g. <code>farmer_id</code>, <code>buyer_id</code>, <code>coordinator_id</code>).
                Use the top navigation role switcher to toggle between different personas.
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              Reset to Default
            </button>
            <button type="submit" className="btn btn-primary" disabled={testing}>
              Save & Test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
