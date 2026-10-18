import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { cropclockApi } from '../api/client';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  CheckCircle,
  AlertCircle,
  Building2,
  Phone,
  MapPin,
  Sparkles,
  Send,
  Briefcase,
} from 'lucide-react';

interface BuyerDashboardProps {
  setActiveTab: (tab: string) => void;
}

export default function BuyerDashboardView({ setActiveTab }: BuyerDashboardProps) {
  const { t, userProfile, userId, showToast, language } = useApp();

  const [harvests, setHarvests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [demandModalOpen, setDemandModalOpen] = useState(false);

  // Sample Buyer Demands
  const [buyerDemands, setBuyerDemands] = useState([
    {
      id: 'dem-1',
      crop: 'Wheat HD-2967',
      quantityTons: 25,
      offeredPricePerQuintal: 2850,
      quality: 'Grade A',
      deliveryLocation: 'Ludhiana Central Godown',
      status: 'Open for Bids',
    },
    {
      id: 'dem-2',
      crop: 'Tomato (Hybrid Pusa)',
      quantityTons: 10,
      offeredPricePerQuintal: 1950,
      quality: 'Firm / Red Ripe',
      deliveryLocation: 'Cold Storage Mandi Ludhiana',
      status: 'Open for Bids',
    },
  ]);

  const [newDemand, setNewDemand] = useState({
    crop: 'Basmati Rice 1121',
    quantityTons: 15,
    offeredPricePerQuintal: 3800,
    quality: 'Grade A / Export Length',
    deliveryLocation: 'Ludhiana Mandi Terminal',
  });

  useEffect(() => {
    async function loadHarvests() {
      setLoading(true);
      try {
        const res = await cropclockApi.getHarvests({ page_size: 6 });
        if (res && res.items) {
          setHarvests(res.items);
        }
      } catch (err) {
        console.warn('Could not load harvests for buyer:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHarvests();
  }, []);

  const handleCreateDemand = (e: React.FormEvent) => {
    e.preventDefault();
    const item = {
      id: `dem-${Date.now()}`,
      ...newDemand,
      status: 'Open for Bids',
    };
    setBuyerDemands([item, ...buyerDemands]);
    setDemandModalOpen(false);
    showToast(language === 'hi' ? 'खरीद मांग सफलतापूर्वक दर्ज की गई!' : 'Purchase demand posted successfully!', 'success');
  };

  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <div className="dashboard-welcome-banner buyer-theme">
        <div className="welcome-avatar-circle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Briefcase size={28} />
        </div>
        <div className="welcome-texts">
          <div className="welcome-badge">
            <Sparkles size={13} /> {t('buyer')} • {userProfile?.businessName || 'Aggarwal Agro Commodities'}
          </div>
          <h1 className="welcome-name-heading">
            {t('buyerDashboardTitle')}: {userProfile?.name}
          </h1>
          <p className="welcome-sub-paragraph">
            {language === 'hi' ? 'थोक खरीद डेस्क' : 'Wholesale Procurement Desk'} • {userProfile?.district || 'Ludhiana'}, {userProfile?.state || 'Punjab'}
          </p>
        </div>
        <div className="quick-switch-tabs">
          <button
            type="button"
            className="dashboard-cta-btn"
            onClick={() => setDemandModalOpen(true)}
          >
            <Plus size={16} />
            <span>{t('postBuyerDemand')}</span>
          </button>
        </div>
      </div>

      {/* Buyer Demands Section */}
      <div className="buyer-section-block">
        <div className="section-header-compact">
          <h3 className="section-title-compact">{language === 'hi' ? 'मेरी सक्रिय खरीद मांगें' : 'My Active Procurement Demands'}</h3>
          <span className="section-subtitle-compact">{language === 'hi' ? 'आपके क्षेत्र के किसान इन सूचियों पर सीधे बोली लगा सकते हैं' : 'Farmers in your region can bid directly on these listings'}</span>
        </div>

        <div className="buyer-demands-grid">
          {buyerDemands.map((dem) => (
            <div key={dem.id} className="buyer-demand-card">
              <div className="demand-top-row">
                <span className="demand-crop-tag">{dem.crop}</span>
                <span className="status-badge-open">{dem.status}</span>
              </div>
              <div className="demand-metric-row">
                <div className="demand-metric">
                  <span className="lbl">{language === 'hi' ? 'आवश्यक मात्रा:' : 'Required Quantity:'}</span>
                  <strong>{dem.quantityTons} Tons</strong>
                </div>
                <div className="demand-metric">
                  <span className="lbl">{language === 'hi' ? 'प्रस्तावित दर:' : 'Indicative Price:'}</span>
                  <strong>₹{dem.offeredPricePerQuintal} / Quintal</strong>
                </div>
              </div>
              <div className="demand-info-footer">
                <MapPin size={13} />
                <span>{dem.deliveryLocation} • {language === 'hi' ? 'गुणवत्ता' : 'Quality'}: {dem.quality}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Farmer Harvests Section */}
      <div className="buyer-section-block">
        <div className="section-header-compact">
          <h3 className="section-title-compact">{language === 'hi' ? 'किसानों की उपलब्ध फसल सूचियां' : 'Available Farmer Harvest Listings'}</h3>
          <button
            type="button"
            className="widget-link-btn"
            onClick={() => setActiveTab('marketplace')}
          >
            <span>{language === 'hi' ? 'फसल बाज़ार खोलें' : 'Open CropClock Trading Terminal'}</span>
          </button>
        </div>

        {loading ? (
          <div className="loading-box">{language === 'hi' ? 'फसल सूचियां लोड हो रही हैं...' : 'Loading farm-gate harvest listings...'}</div>
        ) : harvests.length > 0 ? (
          <div className="harvests-cards-grid">
            {harvests.map((h) => (
              <div key={h.id} className="harvest-offer-card">
                <div className="harvest-card-top">
                  <div>
                    <h4 className="harvest-crop-title">{h.crop}</h4>
                    <span className="harvest-variety-sub">{h.quality_grade} • {language === 'hi' ? `खेत #${h.farm_id}` : `Farm #${h.farm_id}`}</span>
                  </div>
                  <span className="status-pill success-pill">{h.status}</span>
                </div>
                <div className="harvest-metrics-box">
                  <div className="metric-col">
                    <span className="lbl">{language === 'hi' ? 'अनुमानित उपज:' : 'Expected Yield:'}</span>
                    <strong>{h.expected_yield_tons || (h.quantity_kg ? (h.quantity_kg / 1000).toFixed(1) : '2.5')} Tons</strong>
                  </div>
                  <div className="metric-col">
                    <span className="lbl">{language === 'hi' ? 'मांगी गई दर:' : 'Asking Price:'}</span>
                    <strong>₹{h.asking_price_per_ton || '28,000'} / Ton</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="submit-bid-button"
                  onClick={() => setActiveTab('marketplace')}
                >
                  <Send size={14} />
                  <span>{language === 'hi' ? 'खरीद प्रस्ताव भेजें' : 'Submit Purchase Bid'}</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-subtext">{language === 'hi' ? 'इस क्षेत्र में अभी कोई सक्रिय फसल सूची नहीं है।' : 'No active harvest listings found in this district.'}</p>
        )}
      </div>

      {/* Modal: Post Buyer Demand */}
      {demandModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content-card">
            <h3 className="modal-title">Post New Crop Demand</h3>
            <p className="modal-sub">Broadcast your procurement requirements to verified farmers in Punjab and neighboring states.</p>

            <form onSubmit={handleCreateDemand} className="demand-form">
              <div className="form-group">
                <label className="form-label">Crop & Variety</label>
                <input
                  type="text"
                  className="form-input"
                  value={newDemand.crop}
                  onChange={(e) => setNewDemand({ ...newDemand, crop: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Required Quantity (Tons)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newDemand.quantityTons}
                    onChange={(e) => setNewDemand({ ...newDemand, quantityTons: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Offered Price (₹ / Quintal)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newDemand.offeredPricePerQuintal}
                    onChange={(e) => setNewDemand({ ...newDemand, offeredPricePerQuintal: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quality Requirements</label>
                <input
                  type="text"
                  className="form-input"
                  value={newDemand.quality}
                  onChange={(e) => setNewDemand({ ...newDemand, quality: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Mandi / Godown Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={newDemand.deliveryLocation}
                  onChange={(e) => setNewDemand({ ...newDemand, deliveryLocation: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setDemandModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="confirm-btn">
                  Publish Demand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
