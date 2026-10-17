import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { waterwindowApi } from '../api/client';
import {
  Droplets,
  CloudRain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Info,
  Layers,
  Calendar,
} from 'lucide-react';

export default function WaterWindowView() {
  const { userId, farmId, showToast } = useApp();

  const [form, setForm] = useState({
    farmer_id: userId,
    farm_id: farmId,
    crop: 'Wheat',
    growth_stage: 'flowering',
    soil_type: 'loam',
    observed_soil_moisture: 'dry',
    forecasted_rain_expected: false,
  });

  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Sync userId & farmId
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      farmer_id: userId,
      farm_id: farmId,
    }));
  }, [userId, farmId]);

  // Fetch Saved Plans
  const fetchSavedPlans = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const res = await waterwindowApi.getPlans({ page: 1, page_size: 20 });
      setSavedPlans(res.items || []);
    } catch (err) {
      showToast(`Failed to load historical plans: ${err.message}`, 'error');
    } finally {
      setLoadingSaved(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSavedPlans();
  }, [fetchSavedPlans]);

  // Handle Calculate Irrigation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        farmer_id: Number(form.farmer_id),
        farm_id: Number(form.farm_id),
        crop: form.crop.trim(),
        growth_stage: form.growth_stage,
        soil_type: form.soil_type || null,
        observed_soil_moisture: form.observed_soil_moisture || null,
        forecasted_rain_expected: Boolean(form.forecasted_rain_expected),
      };

      const result = await waterwindowApi.createPlan(payload);
      setGeneratedPlan(result);
      showToast('Irrigation advisory generated successfully!', 'success');
      fetchSavedPlans();
    } catch (err) {
      showToast(`Calculation failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sample Scenarios
  const setScenario = (type) => {
    if (type === 'critical_flowering') {
      setForm((prev) => ({
        ...prev,
        crop: 'Wheat',
        growth_stage: 'flowering',
        soil_type: 'sandy',
        observed_soil_moisture: 'dry',
        forecasted_rain_expected: false,
      }));
    } else if (type === 'rain_alert') {
      setForm((prev) => ({
        ...prev,
        crop: 'Rice',
        growth_stage: 'vegetative',
        soil_type: 'clay',
        observed_soil_moisture: 'adequate',
        forecasted_rain_expected: true,
      }));
    } else if (type === 'ripening_withhold') {
      setForm((prev) => ({
        ...prev,
        crop: 'Cotton',
        growth_stage: 'maturity',
        soil_type: 'loam',
        observed_soil_moisture: 'adequate',
        forecasted_rain_expected: false,
      }));
    }
  };

  const getActionBadgeClass = (action) => {
    if (!action) return 'badge-neutral';
    if (action.includes('immediately')) return 'urgency-critical';
    if (action.includes('delay') || action.includes('withhold')) return 'urgency-moderate';
    return 'urgency-low';
  };

  return (
    <div className="module-view-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-block">
          <div className="view-icon-badge bg-cyan">
            <Droplets size={24} />
          </div>
          <div>
            <h2 className="view-title">WaterWindow Irrigation Advisor</h2>
            <p className="view-desc">
              Scientific, explainable crop-water recommendations adapting to phenological growth stage, observed soil moisture, and real-time precipitation forecasts.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, Output on Right */}
      <div className="two-column-layout">
        {/* Input Form Column */}
        <div className="content-card form-column">
          <div className="card-header-bar">
            <h3>Generate Irrigation Advisory</h3>
            <span className="badge-tag">Rule Engine</span>
          </div>

          <div className="scenario-presets">
            <span className="preset-label">Quick Scenarios:</span>
            <button
              type="button"
              className="preset-btn"
              onClick={() => setScenario('critical_flowering')}
            >
              🌸 Flowering (High Demand)
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => setScenario('rain_alert')}
            >
              🌧️ Rain Forecast (Delay)
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => setScenario('ripening_withhold')}
            >
              🌾 Maturity (Withhold)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="irrigation-form">
            <div className="form-row">
              <div className="form-group">
                <label>Farmer User ID</label>
                <input
                  type="number"
                  required
                  value={form.farmer_id}
                  onChange={(e) => setForm({ ...form, farmer_id: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Farm ID</label>
                <input
                  type="number"
                  required
                  value={form.farm_id}
                  onChange={(e) => setForm({ ...form, farm_id: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Crop Cultivated</label>
                <input
                  type="text"
                  required
                  placeholder="Wheat, Rice, Cotton, Maize..."
                  value={form.crop}
                  onChange={(e) => setForm({ ...form, crop: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Crop Growth Stage</label>
                <select
                  value={form.growth_stage}
                  onChange={(e) => setForm({ ...form, growth_stage: e.target.value })}
                >
                  <option value="seedling">Seedling / Germination</option>
                  <option value="vegetative">Vegetative Growth</option>
                  <option value="flowering">Flowering / Heading (Critical)</option>
                  <option value="fruiting">Fruiting / Pod Formation</option>
                  <option value="grain_filling">Grain Filling</option>
                  <option value="maturity">Maturity / Ripening</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Soil Type</label>
                <select
                  value={form.soil_type}
                  onChange={(e) => setForm({ ...form, soil_type: e.target.value })}
                >
                  <option value="loam">Loam (Balanced)</option>
                  <option value="sandy">Sandy (High infiltration, low retention)</option>
                  <option value="clay">Clay (Slow drainage, high retention)</option>
                  <option value="black">Black Soil (High clay content)</option>
                  <option value="alluvial">Alluvial Soil</option>
                </select>
              </div>

              <div className="form-group">
                <label>Observed Soil Moisture</label>
                <select
                  value={form.observed_soil_moisture}
                  onChange={(e) => setForm({ ...form, observed_soil_moisture: e.target.value })}
                >
                  <option value="dry">Dry (Cracked or parched root zone)</option>
                  <option value="adequate">Adequate (Normal soil moisture)</option>
                  <option value="wet">Wet / Saturated (No watering needed)</option>
                </select>
              </div>
            </div>

            <div className="form-group checkbox-card">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.forecasted_rain_expected}
                  onChange={(e) => setForm({ ...form, forecasted_rain_expected: e.target.checked })}
                />
                <div className="checkbox-text">
                  <strong>
                    <CloudRain size={16} /> Significant Rain Forecasted (Next 24-48 hrs)
                  </strong>
                  <p className="subtext">
                    WaterWindow will recommend delaying or withholding irrigation to prevent waterlogging.
                  </p>
                </div>
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Calculating Advisory...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Calculate Water Advisory
                </>
              )}
            </button>
          </form>
        </div>

        {/* Advisory Output Column */}
        <div className="content-card result-column">
          <div className="card-header-bar">
            <h3>Advisory Result</h3>
            {generatedPlan && (
              <span className="timestamp-badge">
                Plan #{generatedPlan.id}
              </span>
            )}
          </div>

          {!generatedPlan ? (
            <div className="empty-state">
              <Droplets size={48} className="empty-icon text-cyan" />
              <h4>No plan generated yet</h4>
              <p>Configure your crop stage and soil parameters on the left and click "Calculate".</p>
            </div>
          ) : (
            <div className="advisory-report">
              <div className="water-volume-box">
                <span className="volume-label">Recommended Action</span>
                <div className="volume-display">
                  <span className="volume-number" style={{ fontSize: '1.9rem', textTransform: 'capitalize' }}>
                    {generatedPlan.recommended_action?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="advisory-stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Crop & Stage</span>
                  <strong className="stat-value">
                    {generatedPlan.crop} ({generatedPlan.growth_stage})
                  </strong>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Scheduled Execution</span>
                  <strong className="stat-value">
                    <Clock size={14} />{' '}
                    {generatedPlan.scheduled_at
                      ? new Date(generatedPlan.scheduled_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Immediate'}
                  </strong>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Recommendation Status</span>
                  <span className={`urgency-badge ${getActionBadgeClass(generatedPlan.recommended_action)}`}>
                    {generatedPlan.recommended_action?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="rationale-box">
                <div className="rationale-header">
                  <Info size={16} />
                  <span>Agronomic Rationale & Rules</span>
                </div>
                <p className="rationale-text">{generatedPlan.reason}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historical Plans Section */}
      <div className="content-card history-section">
        <div className="card-header-bar">
          <h3>
            <Layers size={18} /> Irrigation Plan History ({savedPlans.length})
          </h3>
          <button type="button" className="btn btn-outline btn-sm" onClick={fetchSavedPlans}>
            <RefreshCw size={14} className={loadingSaved ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {savedPlans.length === 0 ? (
          <p className="subtext">No saved plans recorded yet.</p>
        ) : (
          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Plan ID</th>
                  <th>Farm ID</th>
                  <th>Crop</th>
                  <th>Stage</th>
                  <th>Recommended Action</th>
                  <th>Scheduled At</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {savedPlans.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>Farm #{p.farm_id}</td>
                    <td>{p.crop}</td>
                    <td><span className="stage-pill">{p.growth_stage}</span></td>
                    <td className="font-bold">{p.recommended_action?.replace(/_/g, ' ')}</td>
                    <td>{p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : 'Immediate'}</td>
                    <td>{p.created_at ? new Date(p.created_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
