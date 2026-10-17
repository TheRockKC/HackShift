import React from 'react';
import { useApp, ROLES } from '../context/AppContext';
import { Sprout, Clock, Truck, Droplets, Tent, BookOpen, Settings, RefreshCw, Activity } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenSettings }) {
  const { activeRole, changeRole, userId, updateUserId, backendStatus, pingBackend } = useApp();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'cropclock', label: 'CropClock', icon: Clock, badge: 'Harvests' },
    { id: 'fairqueue', label: 'FairQueue', icon: Truck, badge: 'Machinery' },
    { id: 'waterwindow', label: 'WaterWindow', icon: Droplets, badge: 'Irrigation' },
    { id: 'camps', label: 'FarmConnect', icon: Tent, badge: 'Camps' },
    { id: 'schemes', label: 'SchemeSaathi', icon: BookOpen, badge: 'Schemes' },
  ];

  return (
    <header className="navbar-header">
      <div className="navbar-top">
        <div className="brand-container">
          <div className="brand-logo">
            <Sprout size={28} className="brand-icon" />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">AnnData</h1>
            <span className="brand-subtitle">Smart Digital Agriculture Platform</span>
          </div>
        </div>

        <div className="navbar-controls">
          {/* Active Role Selector */}
          <div className="role-switcher-card">
            <span className="control-label">Acting As:</span>
            <div className="role-buttons">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className={`role-btn ${activeRole === role.id ? 'active' : ''}`}
                  onClick={() => changeRole(role.id)}
                  title={`Switch role to ${role.label}`}
                >
                  <span className="role-icon">{role.icon}</span>
                  <span className="role-text">{role.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User ID Indicator & Override */}
          <div className="id-control-card">
            <label htmlFor="user-id-input" className="control-label">
              User ID:
            </label>
            <input
              id="user-id-input"
              type="number"
              className="id-input"
              value={userId || ''}
              onChange={(e) => updateUserId(e.target.value)}
              title="Current user ID sent in API requests for role checks"
            />
          </div>

          {/* Backend Status Badge */}
          <div className="status-badge-container">
            <button
              type="button"
              className={`status-pill ${backendStatus.online ? 'online' : 'offline'}`}
              onClick={pingBackend}
              title={backendStatus.online ? 'Backend Connected. Click to recheck.' : 'Backend Offline. Click to reconnect.'}
            >
              <span className="status-dot"></span>
              <span className="status-text">{backendStatus.online ? 'API Online' : 'API Offline'}</span>
              <RefreshCw size={12} className={`status-refresh ${backendStatus.checking ? 'spin' : ''}`} />
            </button>

            <button
              type="button"
              className="icon-button settings-btn"
              onClick={onOpenSettings}
              title="API and Connection Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="navbar-nav">
        <div className="nav-tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} className="tab-icon" />
                <span className="tab-label">{item.label}</span>
                {item.badge && <span className="tab-badge">{item.badge}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
