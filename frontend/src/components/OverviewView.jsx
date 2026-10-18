import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  Truck,
  Droplets,
  Tent,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Database,
  Cpu,
  Layers,
} from 'lucide-react';

export default function OverviewView({ setActiveTab }) {
  const { backendStatus, activeRole, userId } = useApp();

  const modules = [
    {
      id: 'cropclock',
      title: 'CropClock',
      subtitle: 'Harvest Market & Net Earnings',
      icon: Clock,
      color: 'emerald',
      description:
        'Farmer harvest listings, transparent buyer bidding, net earnings comparison deducting logistics and commission, and atomic reservation.',
      actionLabel: 'Browse Harvests',
      features: ['Dynamic Net Earnings Ranking', 'Zero-Loss Acceptance', 'Buyer Duplicate Guard'],
    },
    {
      id: 'fairqueue',
      title: 'FairQueue',
      subtitle: 'Agricultural Machinery Sharing',
      icon: Truck,
      color: 'blue',
      description:
        'Transparent machinery hiring (tractors, harvesters, rotavators) with conflict-free slot booking and status lifecycle management.',
      actionLabel: 'Rent Machinery',
      features: ['Conflict-Free Time Locking', 'Hourly & Daily Rates', 'Role-Based Cancellation'],
    },
    {
      id: 'waterwindow',
      title: 'WaterWindow',
      subtitle: 'Precision Irrigation Advisor',
      icon: Droplets,
      color: 'cyan',
      description:
        'Rule-based irrigation schedules tailored to crop growth stages, soil moisture levels, soil texture modifiers, and rainfall forecasts.',
      actionLabel: 'Calculate Irrigation',
      features: ['Stage-Specific Dosage (L/acre)', 'Rain Forecast Alerts', 'Explainable Agronomics'],
    },
    {
      id: 'camps',
      title: 'FarmConnect Camps',
      subtitle: 'Digital Literacy & Awareness',
      icon: Tent,
      color: 'amber',
      description:
        'Discover village-level workshops on modern farming, mobile apps, and government scheme registration with next-camp alerts.',
      actionLabel: 'Find Upcoming Camps',
      features: ['Next Camp Spotlight', 'Chronological Sorting', 'District & State Filters'],
    },
    {
      id: 'schemes',
      title: 'SchemeSaathi',
      subtitle: 'Privacy-First Scheme Saathi',
      icon: BookOpen,
      color: 'purple',
      description:
        'Catalogue of verified Central & State agricultural schemes (PM-KISAN, PMFBY, SMAM) with landholding & profile eligibility matching.',
      actionLabel: 'Check Scheme Matches',
      features: ['Zero PII Required', 'Landholding Aggregator', 'Missing Info Guidance'],
    },
  ];

  return (
    <div className="overview-container">
      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div className="banner-content">
          <div className="badge-tag">AnnData Hackathon Prototype</div>
          <h2 className="banner-title">Intelligent Digital Agriculture System</h2>
          <p className="banner-subtitle">
            An end-to-end multi-module platform connecting Indian farmers with markets, machinery, precision water advisories,
            digital literacy camps, and verified government welfare schemes.
          </p>

          <div className="banner-meta">
            <span className="meta-item">
              <span className="meta-label">Active Role:</span>
              <strong className="meta-value role-badge">{activeRole.toUpperCase()}</strong>
            </span>
            <span className="meta-item">
              <span className="meta-label">Current User ID:</span>
              <strong className="meta-value">#{userId}</strong>
            </span>
            <span className="meta-item">
              <span className="meta-label">System Status:</span>
              {backendStatus.online ? (
                <span className="meta-status online">
                  <CheckCircle2 size={16} /> Online (Neon DB Connected)
                </span>
              ) : (
                <span className="meta-status offline">
                  <AlertCircle size={16} /> Backend Offline / Connecting...
                </span>
              )}
            </span>
          </div>
        </div>

        {backendStatus.details && (
          <div className="system-telemetry-card">
            <h4 className="telemetry-title">
              <Database size={16} /> Live DB Telemetry
            </h4>
            <div className="telemetry-grid">
              <div className="telemetry-row">
                <span className="telemetry-key">Database:</span>
                <span className="telemetry-val">{backendStatus.details.database?.status}</span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-key">Branch:</span>
                <span className="telemetry-val">{backendStatus.details.database?.branch}</span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-key">Service:</span>
                <span className="telemetry-val">{backendStatus.details.service}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Modules Grid */}
      <section className="modules-section">
        <div className="section-header">
          <h3 className="section-title">
            <Layers size={20} /> Core Agricultural Modules
          </h3>
          <p className="section-desc">Explore each service powered by the FastAPI backend.</p>
        </div>

        <div className="modules-grid">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.id} className={`module-card border-${m.color}`}>
                <div className="card-top">
                  <div className={`card-icon-bubble bg-${m.color}`}>
                    <Icon size={24} />
                  </div>
                  <div className="card-heading">
                    <h4 className="card-title">{m.title}</h4>
                    <span className="card-subtitle">{m.subtitle}</span>
                  </div>
                </div>

                <p className="card-description">{m.description}</p>

                <div className="card-features">
                  {m.features.map((f, idx) => (
                    <span key={idx} className="feature-pill">
                      ✓ {f}
                    </span>
                  ))}
                </div>

                <div className="card-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setActiveTab(m.id)}
                  >
                    <span>{m.actionLabel}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Developer Quick-Start Notes */}
      <section className="info-guide-box">
        <h4 className="guide-title">
          <Cpu size={18} /> Testing & Evaluation Guide
        </h4>
        <div className="guide-columns">
          <div className="guide-col">
            <h5>Role-Based Simulation</h5>
            <p>
              The top bar lets you seamlessly toggle between <strong>Farmer</strong> (listing crops, booking machinery, generating water plans, checking schemes),
              <strong>Produce Buyer</strong> (submitting price bids), <strong>Machinery Provider</strong> (listing tractors/harvesters), and <strong>Admin</strong> (organizing camps).
            </p>
          </div>
          <div className="guide-col">
            <h5>Pre-filled Quick Testing</h5>
            <p>
              Each module includes handy <em>"Fill Sample Data"</em> buttons with valid dates and parameters so you can test complete end-to-end workflows with one click without typing manual ISO timestamps.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
