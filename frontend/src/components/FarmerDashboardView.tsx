import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sprout,
  ScanLine,
  Droplets,
  Truck,
  BookOpen,
  ShoppingBag,
  Tent,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Bell,
  Sparkles,
} from 'lucide-react';
import { diseaseApi } from '../api/client';

interface FarmerDashboardProps {
  setActiveTab: (tab: string) => void;
}

export default function FarmerDashboardView({ setActiveTab }: FarmerDashboardProps) {
  const { t, userProfile, farmId, userId, notifications, language } = useApp();
  const [recentDetections, setRecentDetections] = useState<any[]>([]);

  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await diseaseApi.getDetections({ page: 1, page_size: 3 });
        if (res && res.items) {
          setRecentDetections(res.items);
        }
      } catch (err) {
        console.warn('Could not load recent scans for dashboard:', err);
      }
    }
    loadRecent();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-avatar-circle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sprout size={28} />
        </div>
        <div className="welcome-texts">
          <div className="welcome-badge">
            <Sparkles size={13} /> {t('farmer')} • {userProfile?.state || 'Punjab'}
          </div>
          <h1 className="welcome-name-heading">
            {t('farmerDashboardTitle')}: {userProfile?.name}
          </h1>
          <p className="welcome-sub-paragraph">
            {userProfile?.farmLocation} • {userProfile?.farmSizeAcres || 15.5} {t('acres')}
          </p>
        </div>
        <div className="quick-switch-tabs">
          <button
            type="button"
            className="dashboard-cta-btn"
            onClick={() => setActiveTab('disease')}
          >
            <ScanLine size={16} />
            <span>{language === 'hi' ? 'पत्ते की जांच करें' : 'Scan Leaf'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Dashboard Cards */}
      <div className="dashboard-widgets-grid">
        {/* Farm & Crop Overview Card */}
        <div className="dashboard-widget-card">
          <div className="widget-card-header">
            <div className="widget-title-area">
              <Sprout size={20} className="widget-icon green" />
              <h3 className="widget-title">{t('farmSummary')}</h3>
            </div>
            <span className="badge-pill">{language === 'hi' ? `खेत #${farmId || 1}` : `Farm #${farmId || 1}`}</span>
          </div>

          <div className="farm-metrics-list">
            <div className="farm-metric-item">
              <span className="metric-label">{language === 'hi' ? 'खेत का रकबा:' : 'Landholding:'}</span>
              <strong className="metric-val">{userProfile?.farmSizeAcres || 15.5} {t('acres')}</strong>
            </div>
            <div className="farm-metric-item">
              <span className="metric-label">{language === 'hi' ? 'मिट्टी का प्रकार:' : 'Soil Classification:'}</span>
              <strong className="metric-val">{userProfile?.soilType || 'Loamy Alluvial Soil'}</strong>
            </div>
            <div className="farm-metric-item">
              <span className="metric-label">{language === 'hi' ? 'सिंचाई का साधन:' : 'Irrigation Source:'}</span>
              <strong className="metric-val">{userProfile?.irrigationSource || 'Tube Well / Solar'}</strong>
            </div>
          </div>

          <div className="crop-chips-area">
            <span className="chips-label">{t('cropsUnderCultivation')}:</span>
            <div className="crops-tags-row">
              {(userProfile?.mainCrops || ['Wheat HD-2967', 'Tomato (Hybrid Pusa)', 'Rice 1121']).map((c: string, i: number) => (
                <span key={i} className="crop-tag-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Sprout size={13} /> {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Precision Irrigation Widget */}
        <div className="dashboard-widget-card">
          <div className="widget-card-header">
            <div className="widget-title-area">
              <Droplets size={20} className="widget-icon cyan" />
              <h3 className="widget-title">{t('smartIrrigation')}</h3>
            </div>
            <button type="button" className="widget-link-btn" onClick={() => setActiveTab('waterwindow')}>
              <span>{language === 'hi' ? 'योजना देखें' : 'View Plan'}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="alert-recommendation-box delay-box">
            <div className="alert-box-top">
              <CheckCircle2 size={18} className="icon-state" />
              <strong>{language === 'hi' ? 'स्थिति: सिंचाई टालें (पर्याप्त नमी)' : 'Status: Delay Irrigation (Adequate Moisture)'}</strong>
            </div>
            <p className="alert-box-text">
              {language === 'hi'
                ? 'अगले 48 घंटों में बारिश की संभावना। वर्तमान में जड़ क्षेत्र में पर्याप्त नमी उपलब्ध है।'
                : 'Rainfall forecast within 48 hours. Soil moisture levels are currently optimal in the crop rootzone.'}
            </p>
          </div>

          <div className="irrigation-stats-summary">
            <div className="stat-pill-sm">
              <span className="lbl">{language === 'hi' ? 'पानी की मात्रा:' : 'Dosage:'}</span>
              <strong>0 L / Acre</strong>
            </div>
            <div className="stat-pill-sm">
              <span className="lbl">{language === 'hi' ? 'अगला मूल्यांकन:' : 'Next Evaluation:'}</span>
              <strong>{language === 'hi' ? 'कल प्रातः' : 'Tomorrow Morning'}</strong>
            </div>
          </div>
        </div>

        {/* Recent Disease Scans Widget */}
        <div className="dashboard-widget-card">
          <div className="widget-card-header">
            <div className="widget-title-area">
              <ScanLine size={20} className="widget-icon forest" />
              <h3 className="widget-title">{t('recentScans')}</h3>
            </div>
            <button type="button" className="widget-link-btn" onClick={() => setActiveTab('disease')}>
              <span>{language === 'hi' ? 'नई जांच' : 'New Scan'}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {recentDetections.length > 0 ? (
            <div className="scans-list-mini">
              {recentDetections.map((scan) => (
                <div key={scan.id} className="scan-mini-item">
                  <div className="scan-item-main">
                    <span className="scan-name">
                      {scan.predicted_class.replace(/___/g, ' - ').replace(/_/g, ' ')}
                    </span>
                    <span className="scan-date">
                      {new Date(scan.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="scan-confidence-badge">
                    {(Number(scan.confidence) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-subtext">{language === 'hi' ? 'आज कोई नया स्कैन दर्ज नहीं है।' : 'No leaf scans recorded yet today.'}</p>
          )}
        </div>

        {/* Machinery Bookings Widget */}
        <div className="dashboard-widget-card">
          <div className="widget-card-header">
            <div className="widget-title-area">
              <Truck size={20} className="widget-icon blue" />
              <h3 className="widget-title">{t('machineryRental')}</h3>
            </div>
            <button type="button" className="widget-link-btn" onClick={() => setActiveTab('fairqueue')}>
              <span>{language === 'hi' ? 'और बुक करें' : 'Rent More'}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="booking-status-card">
            <div className="booking-top-row">
              <strong>Mahindra 575 DI (45 HP)</strong>
              <span className="status-badge-confirmed">{language === 'hi' ? 'पुष्टीकृत' : 'Confirmed'}</span>
            </div>
            <div className="booking-details-line">
              <Calendar size={13} />
              <span>{language === 'hi' ? 'कल 09:00 AM - 01:00 PM (4 घंटे)' : 'Tomorrow 09:00 AM - 01:00 PM (4 hrs)'}</span>
            </div>
            <div className="booking-details-line">
              <MapPin size={13} />
              <span>{language === 'hi' ? 'यंत्र प्रदाता: राजेश मशीनरी' : 'Provider: Rajesh Machinery, Jagraon'}</span>
            </div>
          </div>
        </div>

        {/* Government Schemes Matching Widget */}
        <div className="dashboard-widget-card">
          <div className="widget-card-header">
            <div className="widget-title-area">
              <BookOpen size={20} className="widget-icon purple" />
              <h3 className="widget-title">{t('governmentSchemes')}</h3>
            </div>
            <button type="button" className="widget-link-btn" onClick={() => setActiveTab('schemes')}>
              <span>{language === 'hi' ? 'सभी योजनाएं' : 'All Schemes'}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="scheme-match-teaser">
            <div className="teaser-title-row">
              <strong>Sub-Mission on Agricultural Mechanization (SMAM)</strong>
              <span className="eligible-chip-sm">{t('likelyEligible')}</span>
            </div>
            <p className="teaser-desc">
              {language === 'hi'
                ? 'रोटावेटर, लेजर लैंड लेवलर व आधुनिक कृषि यंत्रों पर 50% तक सरकारी सब्सिडी।'
                : 'Eligible for 50% subsidy on rotavators and solar water pumps for smallholder farmers.'}
            </p>
          </div>
        </div>

        {/* Produce Marketplace & Mandi Ticker */}
        <div className="dashboard-widget-card">
          <div className="widget-card-header">
            <div className="widget-title-area">
              <ShoppingBag size={20} className="widget-icon amber" />
              <h3 className="widget-title">{t('marketplace')}</h3>
            </div>
            <button type="button" className="widget-link-btn" onClick={() => setActiveTab('marketplace')}>
              <span>{language === 'hi' ? 'फसल बेचें' : 'Sell Crops'}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="mandi-price-ticker-box">
            <div className="ticker-row">
              <span>Wheat (Sharbati):</span>
              <strong>₹2,850 / Quintal</strong>
            </div>
            <div className="ticker-row">
              <span>Tomato (Hybrid):</span>
              <strong>₹1,800 / Quintal</strong>
            </div>
            <div className="ticker-row">
              <span>Basmati Rice 1121:</span>
              <strong>₹3,900 / Quintal</strong>
            </div>
            <div className="ticker-source-note">Source: Ludhiana Mandi Official Board (Sample)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
