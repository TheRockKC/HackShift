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
  Zap,
  ShieldCheck,
  Sun,
  Sprout,
  Power,
  PowerOff,
  Radio,
  MapPin,
  Wind,
  Thermometer,
} from 'lucide-react';

export default function WaterWindowView() {
  const { userId, farmId, showToast, t, language, userProfile } = useApp();

  const [form, setForm] = useState({
    farmer_id: userId || 1,
    farm_id: farmId || 1,
    crop: 'Wheat',
    growth_stage: 'flowering',
    soil_type: 'loam',
    observed_soil_moisture: 'dry',
  });

  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Live Meteorological Weather State (Auto-fetched via Weather API)
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherCity, setWeatherCity] = useState(userProfile?.farmLocation || 'Ludhiana, Punjab');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [customLocationInput, setCustomLocationInput] = useState('');

  // Keep farmer_id and farm_id automatically in sync without exposing them in UI
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      farmer_id: userId || 1,
      farm_id: farmId || 1,
    }));
  }, [userId, farmId]);

  // Fetch Live Weather & Autonomous Rain Prediction
  const fetchLiveWeather = useCallback(async (loc) => {
    setLoadingWeather(true);
    try {
      const targetLoc = loc || weatherCity || 'Ludhiana, Punjab';
      const parts = targetLoc.split(',');
      const district = (parts[0] || 'Ludhiana').trim();
      const state = (parts[1] || 'Punjab').trim();

      const res = await waterwindowApi.getWeather({ district, state });
      setWeatherData(res);
    } catch (err) {
      console.warn('Weather fetch warning:', err);
    } finally {
      setLoadingWeather(false);
    }
  }, [weatherCity]);

  useEffect(() => {
    fetchLiveWeather();
  }, [fetchLiveWeather]);

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

  // Handle Calculate Irrigation (AI autonomously determines rain prediction from weather)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      // Notice: We do NOT ask the user for weather.
      // If weatherData is available, we pass its self-predicted status, or leave it to backend to evaluate
      const payload = {
        farmer_id: Number(form.farmer_id || 1),
        farm_id: Number(form.farm_id || 1),
        crop: form.crop.trim(),
        growth_stage: form.growth_stage,
        soil_type: form.soil_type || 'loam',
        observed_soil_moisture: form.observed_soil_moisture || 'adequate',
        forecasted_rain_expected: weatherData ? weatherData.is_rain_forecasted : undefined,
      };

      const result = await waterwindowApi.createPlan(payload);
      setGeneratedPlan(result);
      showToast(
        language === 'hi'
          ? 'मौसम AI द्वारा स्वचालित सिंचाई सलाह तैयार कर ली गई है!'
          : 'Smart tubewell advisory generated using autonomous weather AI!',
        'success'
      );
      fetchSavedPlans();
    } catch (err) {
      showToast(`Calculation failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sample Scenarios (Purely based on crop stage and soil conditions - no manual weather tampering)
  const setScenario = (type) => {
    if (type === 'critical_flowering') {
      setForm((prev) => ({
        ...prev,
        crop: 'Wheat',
        growth_stage: 'flowering',
        soil_type: 'loam',
        observed_soil_moisture: 'dry',
      }));
    } else if (type === 'vegetative_clay') {
      setForm((prev) => ({
        ...prev,
        crop: 'Rice',
        growth_stage: 'vegetative',
        soil_type: 'clay',
        observed_soil_moisture: 'adequate',
      }));
    } else if (type === 'ripening_withhold') {
      setForm((prev) => ({
        ...prev,
        crop: 'Cotton',
        growth_stage: 'maturity',
        soil_type: 'loam',
        observed_soil_moisture: 'adequate',
      }));
    }
  };

  // Determine whether to run tubewell or not based on recommendation
  const isTubewellRecommended = () => {
    if (!generatedPlan) return false;
    const act = (generatedPlan.recommended_action || '').toLowerCase();
    if (
      act.includes('postpone') ||
      act.includes('suspend') ||
      act.includes('withhold') ||
      act.includes('delay')
    ) {
      return false;
    }
    return true;
  };

  const handleApplyCustomLocation = (e) => {
    e.preventDefault();
    if (customLocationInput.trim()) {
      setWeatherCity(customLocationInput.trim());
      fetchLiveWeather(customLocationInput.trim());
      setIsEditingLocation(false);
      setCustomLocationInput('');
    }
  };

  const cropQuickPills = [
    { name: 'Wheat', hi: 'गेहूं' },
    { name: 'Rice', hi: 'धान' },
    { name: 'Tomato', hi: 'टमाटर' },
    { name: 'Cotton', hi: 'कपास' },
    { name: 'Sugarcane', hi: 'गन्ना' },
    { name: 'Maize', hi: 'मक्का' },
  ];

  return (
    <div className="module-view-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-block">
          <div className="view-icon-badge bg-cyan">
            <Droplets size={26} />
          </div>
          <div>
            <h2 className="view-title">
              {language === 'hi' ? 'स्मार्ट सिंचाई और ट्यूबवेल सलाहकार' : 'WaterWindow Smart Irrigation Advisor'}
            </h2>
            <p className="view-desc">
              {language === 'hi'
                ? 'लाइव मौसम उपग्रह डेटा, वास्तविक वर्षा पूर्वानुमान और फसल की अवस्था के आधार पर ट्यूबवेल कब चलाना है और कब बंद रखना है।'
                : 'Autonomous AI guiding tubewell operations using live meteorological radar, real-time rain prediction, crop stage, and soil texture.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, Output on Right */}
      <div className="two-column-layout">
        {/* Input Form Column */}
        <div className="content-card form-column">
          <div className="card-header-bar">
            <h3>{language === 'hi' ? 'खेत और फसल की जानकारी' : 'Field & Crop Conditions'}</h3>
            <span
              className="badge-tag"
              style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'inline-block',
                }}
              />
              Live Weather AI Active
            </span>
          </div>

          {/* Connected Farm Location Strip */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.65rem 0.9rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sprout size={18} style={{ color: '#059669' }} />
              <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                <strong>{userProfile?.name || 'Balvinder Singh'}</strong> • Field ({weatherCity}) •{' '}
                {userProfile?.farmSizeAcres || 12.5} Acres
              </div>
            </div>

            <button
              type="button"
              className="btn-link"
              style={{ fontSize: '0.78rem', color: '#059669', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}
              onClick={() => setIsEditingLocation(!isEditingLocation)}
            >
              {isEditingLocation ? (language === 'hi' ? 'रद्द करें' : 'Cancel') : (language === 'hi' ? 'स्थान बदलें' : 'Change Location')}
            </button>
          </div>

          {/* Location edit form */}
          {isEditingLocation && (
            <form onSubmit={handleApplyCustomLocation} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder={language === 'hi' ? 'उदा. लुधियाना, पंजाब या करनाल, हरियाणा' : 'e.g. Ludhiana, Punjab or Karnal, Haryana'}
                value={customLocationInput}
                onChange={(e) => setCustomLocationInput(e.target.value)}
                style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.45rem 0.85rem' }}>
                {language === 'hi' ? 'अपडेट करें' : 'Update'}
              </button>
            </form>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* LIVE WEATHER RADAR & AUTONOMOUS RAIN PREDICTION CARD */}
          {/* ---------------------------------------------------------------- */}
          <div
            style={{
              background: 'linear-gradient(180deg, #f0fdfa 0%, #f8fafc 100%)',
              border: '1.5px solid #ccfbf1',
              borderRadius: '12px',
              padding: '1rem 1.15rem',
              marginBottom: '1.25rem',
              boxShadow: '0 2px 8px rgba(15, 118, 110, 0.05)',
            }}
          >
            {/* Radar Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Radio size={17} style={{ color: '#0f766e' }} />
                <strong style={{ fontSize: '0.9rem', color: '#134e4a' }}>
                  {language === 'hi' ? 'मौसम उपग्रह टेलीमेट्री (स्वचालित पूर्वानुमान)' : 'Satellite Weather Telemetry (Auto-Predict)'}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => fetchLiveWeather()}
                disabled={loadingWeather}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0d9488',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontWeight: 650,
                }}
              >
                <RefreshCw size={13} className={loadingWeather ? 'spin' : ''} />
                {loadingWeather ? (language === 'hi' ? 'सिंक हो रहा है...' : 'Syncing...') : (language === 'hi' ? 'लाइव सिंक' : 'Live Sync')}
              </button>
            </div>

            {/* Live Weather Metrics Grid */}
            {weatherData ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '0.85rem' }}>
                  {/* Temperature */}
                  <div style={{ background: '#ffffff', borderRadius: '8px', padding: '0.6rem 0.75rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      <Thermometer size={13} style={{ color: '#ea580c' }} />
                      <span>{language === 'hi' ? 'तापमान' : 'Temperature'}</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                      {weatherData.temperature}°C
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#0d9488' }}>
                      {weatherData.condition} {weatherData.icon}
                    </div>
                  </div>

                  {/* Humidity */}
                  <div style={{ background: '#ffffff', borderRadius: '8px', padding: '0.6rem 0.75rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      <Droplets size={13} style={{ color: '#0284c7' }} />
                      <span>{language === 'hi' ? 'आर्द्रता' : 'Humidity'}</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                      {weatherData.humidity}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {weatherData.humidity > 70 ? (language === 'hi' ? 'उच्च नमी' : 'High Moisture') : (language === 'hi' ? 'सामान्य' : 'Moderate')}
                    </div>
                  </div>

                  {/* 48h Rain Probability & Volume */}
                  <div style={{ background: '#ffffff', borderRadius: '8px', padding: '0.6rem 0.75rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      <CloudRain size={13} style={{ color: '#2563eb' }} />
                      <span>{language === 'hi' ? '48 घंटे वर्षा जोखिम' : '48h Rain Risk'}</span>
                    </div>
                    <div
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: weatherData.is_rain_forecasted ? '#dc2626' : '#166534',
                        marginTop: '2px',
                      }}
                    >
                      {weatherData.rain_probability_48h}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {weatherData.rainfall_48h_mm} {language === 'hi' ? 'मिमी वर्षा अनुमान' : 'mm forecast'}
                    </div>
                  </div>
                </div>

                {/* Autonomous Rain Prediction Decision Banner */}
                {weatherData.is_rain_forecasted ? (
                  <div
                    style={{
                      background: '#fff1f2',
                      border: '1.5px solid #fecdd3',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                    }}
                  >
                    <CloudRain size={20} style={{ color: '#e11d48', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#9f1239', lineHeight: 1.4 }}>
                      <strong>{language === 'hi' ? 'वर्षा का पूर्वानुमान है:' : 'Rain Forecasted:'}</strong>{' '}
                      {language === 'hi'
                        ? `अगले 24-48 घंटों में बारिश की संभावना (${weatherData.rain_probability_48h}%) है। AI स्वचालित रूप से ट्यूबवेल बंद रखने की सलाह देगा।`
                        : `Significant precipitation expected in next 24-48h (${weatherData.rain_probability_48h}% chance, ~${weatherData.rainfall_48h_mm}mm). AI will advise holding tubewell to conserve power & avoid waterlogging.`}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1.5px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                    }}
                  >
                    <Sun size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#14532d', lineHeight: 1.4 }}>
                      <strong>{language === 'hi' ? 'बारिश की कोई संभावना नहीं:' : 'No Rain Forecasted:'}</strong>{' '}
                      {language === 'hi'
                        ? `अगले 48 घंटों में मौसम साफ और शुष्क रहने का अनुमान है। फसल की अवस्था अनुसार ट्यूबवेल चलाना सुरक्षित है।`
                        : `Clear dry weather expected over next 48h (0% rain risk). Weather conditions are optimal for scheduled crop root-zone irrigation.`}
                    </div>
                  </div>
                )}

                {/* 3-Day Forecast Cards Strip */}
                {weatherData.forecast_days && weatherData.forecast_days.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {weatherData.forecast_days.map((day, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #f1f5f9',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          textAlign: 'center',
                          fontSize: '0.72rem',
                          color: '#475569',
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {idx === 0 ? (language === 'hi' ? 'आज' : 'Today') : idx === 1 ? (language === 'hi' ? 'कल' : 'Tomorrow') : (language === 'hi' ? 'परसों' : 'Day 3')}
                        </div>
                        <div style={{ fontSize: '0.8rem', margin: '2px 0', color: '#64748b' }}>{day.weather_desc || 'Fair'}</div>
                        <div style={{ fontWeight: 700 }}>{Math.round(day.temp_max)}° / {Math.round(day.temp_min)}°</div>
                        <div style={{ color: day.precipitation_prob > 20 ? '#2563eb' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', fontSize: '0.78rem' }}>
                          <Droplets size={12} /> {day.precipitation_prob}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                <RefreshCw size={18} className="spin" style={{ margin: '0 auto 6px auto', display: 'block' }} />
                <span>Fetching live meteorological radar for {weatherCity}...</span>
              </div>
            )}

            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.65rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} style={{ color: '#059669' }} />
              <span>
                {language === 'hi'
                  ? 'मौसम डेटा और बारिश का अनुमान AI द्वारा स्वचालित रूप से प्राप्त किया जाता है। आपसे कोई इनपुट नहीं मांगा जाएगा।'
                  : 'Weather telemetry and rain predictions are calculated autonomously via Open-Meteo API. Zero manual input required.'}
              </span>
            </div>
          </div>

          {/* Quick Scenario Presets */}
          <div className="scenario-presets" style={{ marginBottom: '1.25rem' }}>
            <span className="preset-label" style={{ fontWeight: 650, fontSize: '0.82rem', color: '#475569' }}>
              {language === 'hi' ? 'त्वरित परिदृश्य:' : 'Quick Presets:'}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
              <button
                type="button"
                className="preset-btn"
                onClick={() => setScenario('critical_flowering')}
                style={{ padding: '5px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                {language === 'hi' ? 'फूल आना (उच्च जल मांग)' : 'Wheat Flowering (High Demand)'}
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => setScenario('vegetative_clay')}
                style={{ padding: '5px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                {language === 'hi' ? 'धान बढ़वार (चिकनी मिट्टी)' : 'Paddy Vegetative (Clay Soil)'}
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => setScenario('ripening_withhold')}
                style={{ padding: '5px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                {language === 'hi' ? 'फसल पकाव (सिंचाई रोकें)' : 'Cotton Ripening (Withhold Water)'}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="irrigation-form">
            {/* Quick Crop Selector */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                {language === 'hi' ? 'फसल चुनें' : 'Crop Cultivated'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {cropQuickPills.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    style={{
                      border: form.crop.toLowerCase() === c.name.toLowerCase() ? '2px solid #059669' : '1px solid #e2e8f0',
                      background: form.crop.toLowerCase() === c.name.toLowerCase() ? '#ecfdf5' : '#ffffff',
                      color: form.crop.toLowerCase() === c.name.toLowerCase() ? '#065f46' : '#334155',
                      fontWeight: 650,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      justifyContent: 'center',
                    }}
                    onClick={() => setForm({ ...form, crop: c.name })}
                  >
                    <Sprout size={15} style={{ color: form.crop.toLowerCase() === c.name.toLowerCase() ? '#059669' : '#94a3b8' }} />
                    <span>{language === 'hi' ? c.hi : c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Growth Stage */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                {language === 'hi' ? 'फसल की वृद्धि अवस्था (Growth Stage)' : 'Crop Growth Stage'}
              </label>
              <select
                className="form-input"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                value={form.growth_stage}
                onChange={(e) => setForm({ ...form, growth_stage: e.target.value })}
              >
                <option value="seedling">{language === 'hi' ? 'अंकुरण / नर्सरी (Seedling / Germination)' : 'Seedling / Germination'}</option>
                <option value="vegetative">{language === 'hi' ? 'वानस्पतिक बढ़वार (Vegetative Growth)' : 'Vegetative Growth'}</option>
                <option value="flowering">{language === 'hi' ? 'फूल / बाली आना (Flowering / Heading - Critical)' : 'Flowering / Heading (Critical Stage)'}</option>
                <option value="fruiting">{language === 'hi' ? 'फल / फली बनना (Fruiting / Pod Formation)' : 'Fruiting / Pod Formation'}</option>
                <option value="grain_filling">{language === 'hi' ? 'दाना भरना (Grain Filling)' : 'Grain Filling'}</option>
                <option value="maturity">{language === 'hi' ? 'पकाव अवस्था (Maturity / Ripening)' : 'Maturity / Ripening'}</option>
              </select>
            </div>

            {/* Soil Type and Soil Moisture Row */}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                  {language === 'hi' ? 'मिट्टी का प्रकार' : 'Soil Classification'}
                </label>
                <select
                  className="form-input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={form.soil_type}
                  onChange={(e) => setForm({ ...form, soil_type: e.target.value })}
                >
                  <option value="loam">{language === 'hi' ? 'दोमट मिट्टी (Loam - Balanced)' : 'Loam (Balanced)'}</option>
                  <option value="sandy">{language === 'hi' ? 'बलुई मिट्टी (Sandy - High Drainage)' : 'Sandy (High Infiltration)'}</option>
                  <option value="clay">{language === 'hi' ? 'चिकनी मिट्टी (Clay - High Retention)' : 'Clay (High Water Holding)'}</option>
                  <option value="black">{language === 'hi' ? 'काली मिट्टी (Black Cotton Soil)' : 'Black Cotton Soil'}</option>
                  <option value="alluvial">{language === 'hi' ? 'जलोढ़ मिट्टी (Alluvial Soil)' : 'Alluvial Soil'}</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                  {language === 'hi' ? 'मिट्टी की वर्तमान नमी' : 'Observed Soil Moisture'}
                </label>
                <select
                  className="form-input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={form.observed_soil_moisture}
                  onChange={(e) => setForm({ ...form, observed_soil_moisture: e.target.value })}
                >
                  <option value="dry">{language === 'hi' ? 'सूखी / दरारें (Dry / Parched)' : 'Dry (Parched root zone)'}</option>
                  <option value="adequate">{language === 'hi' ? 'सामान्य नमी (Adequate Moisture)' : 'Adequate (Normal soil moisture)'}</option>
                  <option value="wet">{language === 'hi' ? 'गीली / संतृप्त (Wet / Saturated)' : 'Wet / Saturated (No watering needed)'}</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  <span>{language === 'hi' ? 'मौसम आधारित सलाह तैयार की जा रही है...' : 'Calculating Weather-Smart Advisory...'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>{language === 'hi' ? 'स्मार्ट ट्यूबवेल सलाह प्राप्त करें' : 'Generate Smart Tubewell Guidance'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Advisory Output Column */}
        <div className="content-card result-column">
          <div className="card-header-bar">
            <h3>{language === 'hi' ? 'ट्यूबवेल संचालन निर्णय' : 'Tubewell Operation Advisory'}</h3>
            {generatedPlan && (
              <span className="timestamp-badge">
                Advisory #{generatedPlan.id}
              </span>
            )}
          </div>

          {!generatedPlan ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <Droplets size={52} className="empty-icon text-cyan" style={{ margin: '0 auto 1rem auto', color: '#0284c7' }} />
              <h4 style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '0.4rem' }}>
                {language === 'hi' ? 'अभी कोई सिंचाई योजना तैयार नहीं है' : 'No Advisory Generated Yet'}
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '380px', margin: '0 auto' }}>
                {language === 'hi'
                  ? 'फसल और मिट्टी की जानकारी चुनें। AI लाइव मौसम के आधार पर खुद तय करेगा कि ट्यूबवेल कब चलाना है।'
                  : 'Select your crop and soil condition. The Weather AI automatically checks meteorological forecast and guides your tubewell decision.'}
              </p>
            </div>
          ) : (
            <div className="advisory-report">
              {/* BIG TUBEWELL STATUS BANNER */}
              {isTubewellRecommended() ? (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                    color: '#ffffff',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '1.25rem',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: '#ffffff', color: '#047857', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                      <Power size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.9 }}>
                        {language === 'hi' ? 'स्वचालित निर्णय (WEATHER AI DECISION)' : 'AUTOMATED AI DECISION'}
                      </div>
                      <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                        {language === 'hi' ? 'ट्यूबवेल चलाएं (RUN TUBEWELL)' : 'RUN TUBEWELL NOW'}
                      </div>
                    </div>
                  </div>

                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', opacity: 0.95, lineHeight: 1.4 }}>
                    {language === 'hi'
                      ? `फसल (${generatedPlan.crop}) महत्वपूर्ण अवस्था में है, और मौसम शुष्क रहने का अनुमान है (कोई बारिश नहीं)। पैदावार सुरक्षित रखने के लिए सिंचाई आवश्यक है।`
                      : `Critical moisture window active for ${generatedPlan.crop} with zero rain forecasted. Apply recommended irrigation depth to safeguard harvest yield.`}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>{language === 'hi' ? 'अनुशंसित मोटर अवधि' : 'Pump Duration'}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>3.5 - 4.0 Hours</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>{language === 'hi' ? 'उत्कृष्ट समय (कम वाष्पीकरण)' : 'Optimal Time Window'}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>05:00 AM - 08:30 AM</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)',
                    color: '#ffffff',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '1.25rem',
                    boxShadow: '0 4px 14px rgba(185, 28, 28, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: '#ffffff', color: '#b91c1c', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                      <PowerOff size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.9 }}>
                        {language === 'hi' ? 'स्वचालित निर्णय (WEATHER AI DECISION)' : 'AUTOMATED AI DECISION'}
                      </div>
                      <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                        {language === 'hi' ? 'ट्यूबवेल बंद रखें (DO NOT IRRIGATE)' : 'DO NOT RUN TUBEWELL'}
                      </div>
                    </div>
                  </div>

                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', opacity: 0.95, lineHeight: 1.4 }}>
                    {language === 'hi'
                      ? 'मौसम उपग्रह द्वारा बारिश का पूर्वानुमान लगाया गया है या मिट्टी संतृप्त है। ट्यूबवेल बंद रखकर बिजली बचाएं और जलभराव से बचें।'
                      : 'Irrigation withholding or postponement recommended. Incoming precipitation or adequate root saturation protects crops from root asphyxiation while saving energy.'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>{language === 'hi' ? 'बिजली / ईंधन की बचत' : 'Energy Savings'}</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>~14 kWh (₹120-180 Saved)</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>{language === 'hi' ? 'भूजल की बचत' : 'Groundwater Conserved'}</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>~48,000 Liters / Acre</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Details Grid */}
              <div className="advisory-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div className="stat-card" style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span className="stat-label" style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>
                    {language === 'hi' ? 'फसल व वृद्धि अवस्था' : 'Crop & Stage'}
                  </span>
                  <strong className="stat-value" style={{ fontSize: '0.92rem', color: '#1e293b' }}>
                    {generatedPlan.crop} ({generatedPlan.growth_stage})
                  </strong>
                </div>

                <div className="stat-card" style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span className="stat-label" style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>
                    {language === 'hi' ? 'संचालन समय' : 'Execution Window'}
                  </span>
                  <strong className="stat-value" style={{ fontSize: '0.92rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} />
                    {generatedPlan.scheduled_at
                      ? new Date(generatedPlan.scheduled_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : (language === 'hi' ? 'स्थगित / आवश्यकता अनुसार' : 'Hold / As Needed')}
                  </strong>
                </div>

                <div className="stat-card" style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span className="stat-label" style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>
                    {language === 'hi' ? 'पानी की गहराई / मात्रा' : 'Water Depth'}
                  </span>
                  <strong className="stat-value" style={{ fontSize: '0.92rem', color: isTubewellRecommended() ? '#047857' : '#b91c1c' }}>
                    {isTubewellRecommended() ? (language === 'hi' ? '45 - 50 मिमी' : '45 - 50 mm Depth') : (language === 'hi' ? '0 मिमी (सिंचाई रोकें)' : '0 mm (Hold)')}
                  </strong>
                </div>
              </div>

              {/* Agronomic Rationale & Rules */}
              <div className="rationale-box" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1rem' }}>
                <div className="rationale-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#166534', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Info size={16} />
                  <span>{language === 'hi' ? 'कृषि वैज्ञानिक तर्क (Agronomic Rationale)' : 'Agronomic Rationale & Meteorological Telemetry'}</span>
                </div>
                <p className="rationale-text" style={{ margin: 0, fontSize: '0.85rem', color: '#14532d', lineHeight: 1.5 }}>
                  {generatedPlan.reason}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historical Plans Section */}
      <div className="content-card history-section" style={{ marginTop: '2rem' }}>
        <div className="card-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', margin: 0 }}>
            <Layers size={18} /> {language === 'hi' ? 'सिंचाई योजनाओं का इतिहास' : 'Irrigation Plan History'} ({savedPlans.length})
          </h3>
          <button type="button" className="btn btn-outline btn-sm" onClick={fetchSavedPlans} style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <RefreshCw size={13} className={loadingSaved ? 'spin' : ''} /> {language === 'hi' ? 'रिफ्रेश' : 'Refresh'}
          </button>
        </div>

        {savedPlans.length === 0 ? (
          <p className="subtext" style={{ color: '#64748b', fontStyle: 'italic' }}>
            {language === 'hi' ? 'कोई पूर्व सिंचाई रिकॉर्ड नहीं मिला।' : 'No saved plans recorded yet.'}
          </p>
        ) : (
          <div className="comparison-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="comparison-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '8px 12px' }}>{language === 'hi' ? 'योजना आईडी' : 'Plan ID'}</th>
                  <th style={{ padding: '8px 12px' }}>{language === 'hi' ? 'फसल' : 'Crop'}</th>
                  <th style={{ padding: '8px 12px' }}>{language === 'hi' ? 'वृद्धि अवस्था' : 'Growth Stage'}</th>
                  <th style={{ padding: '8px 12px' }}>{language === 'hi' ? 'सलाह / कार्रवाई' : 'Action Guidance'}</th>
                  <th style={{ padding: '8px 12px' }}>{language === 'hi' ? 'संचालन समय' : 'Execution Time'}</th>
                  <th style={{ padding: '8px 12px' }}>{language === 'hi' ? 'दिनांक' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {savedPlans.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px' }}>#{p.id}</td>
                    <td style={{ padding: '8px 12px' }}><strong>{p.crop}</strong></td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="stage-pill" style={{ background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>
                        {p.growth_stage}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '8px 12px',
                        color:
                          p.recommended_action?.toLowerCase().includes('postpone') ||
                          p.recommended_action?.toLowerCase().includes('suspend') ||
                          p.recommended_action?.toLowerCase().includes('withhold')
                            ? '#b91c1c'
                            : '#047857',
                        fontWeight: 600,
                      }}
                    >
                      {p.recommended_action?.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {p.scheduled_at
                        ? new Date(p.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Hold / As Needed'}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </td>
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
