import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { cropclockApi } from '../api/client';
import {
  Clock,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Tag,
  RefreshCw,
  Send,
  Award,
} from 'lucide-react';

export default function CropClockView() {
  const { userId, farmId, showToast, language, t } = useApp();

  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    crop: '',
    state: '',
    district: '',
    status: 'all',
  });

  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(null); // harvest object
  const [showCompareModal, setShowCompareModal] = useState(null); // harvest object
  const [compareData, setCompareData] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // Create Harvest Form
  const [harvestForm, setHarvestForm] = useState({
    farmer_id: userId,
    farm_id: farmId,
    crop: 'Wheat HD-2967',
    quantity_kg: 2500,
    expected_harvest_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    quality_grade: 'Grade A',
  });

  // Buyer Offer Form
  const [offerForm, setOfferForm] = useState({
    buyer_id: userId,
    price_per_kg: 28.5,
    transport_cost: 0.0,
    other_costs: 0.0,
  });

  // Load Harvests
  const fetchHarvests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cropclockApi.getHarvests(filters);
      setHarvests(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      showToast(`Failed to load harvests: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    fetchHarvests();
  }, [fetchHarvests]);

  // Sync userId & farmId into form
  useEffect(() => {
    setHarvestForm((prev) => ({
      ...prev,
      farmer_id: userId,
      farm_id: farmId,
    }));
    setOfferForm((prev) => ({
      ...prev,
      buyer_id: userId,
    }));
  }, [userId, farmId]);

  // Handle Create Harvest
  const handleCreateHarvest = async (e) => {
    e.preventDefault();
    try {
      const safeFarmerId = (userId >= 1 && userId <= 50) ? Number(userId) : 1;
      const safeFarmId = (farmId >= 1 && farmId <= 50) ? Number(farmId) : 1;
      await cropclockApi.createHarvest({
        farmer_id: safeFarmerId,
        farm_id: safeFarmId,
        crop: harvestForm.crop.trim(),
        quantity_kg: Number(harvestForm.quantity_kg),
        expected_harvest_date: harvestForm.expected_harvest_date,
        quality_grade: harvestForm.quality_grade ? harvestForm.quality_grade.trim() : null,
      });
      showToast(
        language === 'hi' ? 'फसल सूची सफलतापूर्वक बनाई गई!' : 'Harvest listing created successfully!',
        'success'
      );
      setShowCreateModal(false);
      fetchHarvests();
    } catch (err) {
      showToast(`Error creating harvest: ${err.message}`, 'error');
    }
  };

  // Handle Submit Offer
  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!showOfferModal) return;

    // Prevent self-bidding: farmer offering this harvest cannot purchase it
    if (showOfferModal.farmer_id && Number(showOfferModal.farmer_id) === Number(userId)) {
      showToast(
        language === 'hi'
          ? 'आप अपनी स्वयं की फसल सूची पर खरीद बोली नहीं लगा सकते।'
          : 'The farmer offering this harvest cannot buy their own listing.',
        'error'
      );
      return;
    }

    try {
      const safeBuyerId = (offerForm.buyer_id >= 1 && offerForm.buyer_id <= 50) ? Number(offerForm.buyer_id) : 2;
      await cropclockApi.submitOffer(showOfferModal.id, {
        buyer_id: safeBuyerId,
        price_per_kg: Number(offerForm.price_per_kg),
        transport_cost: Number(offerForm.transport_cost || 0),
        other_costs: Number(offerForm.other_costs || 0),
      });
      showToast(
        language === 'hi'
          ? 'खरीद बोली सफलतापूर्वक दर्ज की गई!'
          : 'Buyer offer submitted successfully!',
        'success'
      );
      setShowOfferModal(null);
      fetchHarvests();
    } catch (err) {
      showToast(
        language === 'hi'
          ? `बोली दर्ज करने में त्रुटि: ${err.message}`
          : `Error submitting offer: ${err.message}`,
        'error'
      );
    }
  };

  // Open Compare Offers
  const handleOpenCompare = async (harvest) => {
    setShowCompareModal(harvest);
    setLoadingCompare(true);
    try {
      const data = await cropclockApi.compareOffers(harvest.id);
      setCompareData(data);
    } catch (err) {
      showToast(`Error loading offer comparison: ${err.message}`, 'error');
    } finally {
      setLoadingCompare(false);
    }
  };

  // Handle Accept/Reject Offer
  const handleUpdateOfferStatus = async (offerId, newStatus) => {
    try {
      const safeFarmerId = (userId >= 1 && userId <= 4) ? Number(userId) : 1;
      await cropclockApi.updateOfferStatus(offerId, newStatus, safeFarmerId);
      if (newStatus === 'accepted') {
        showToast('Offer accepted! Harvest is reserved/sold to the buyer with 100% Escrow Guarantee.', 'success');
      } else {
        showToast(`Offer ${newStatus} successfully!`, 'success');
      }
      if (showCompareModal) {
        handleOpenCompare(showCompareModal);
      }
      fetchHarvests();
    } catch (err) {
      showToast(`Failed to update offer: ${err.message}`, 'error');
    }
  };

  // Pre-fill Sample Wheat Harvest
  const fillSampleHarvest = () => {
    setHarvestForm({
      farmer_id: userId,
      farm_id: farmId,
      crop: 'Sharbati Wheat Special',
      quantity_kg: 3200,
      expected_harvest_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      quality_grade: 'FAQ Premium',
    });
  };

  return (
    <div className="module-view-container">
      {/* Header Banner */}
      <div className="view-header">
        <div className="view-title-block">
          <div className="view-icon-badge bg-emerald">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="view-title">{language === 'hi' ? 'क्रॉपक्लॉक फसल बाज़ार' : 'CropClock Marketplace'}</h2>
            <p className="view-desc">
              {language === 'hi'
                ? 'आगामी फसलों की सूची बनाएं, पारदर्शी बोलियां प्राप्त करें और वास्तविक शुद्ध मुनाफ़ा जानें।'
                : 'List future crop harvests, receive transparent buyer bids, and rank offers by true net earnings after transport deductions.'}
            </p>
          </div>
        </div>

        <div className="view-actions">
          <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            <span>{t('createListing')}</span>
          </button>
          <button type="button" className="btn btn-outline" onClick={fetchHarvests} title={language === 'hi' ? 'ताज़ा करें' : 'Refresh listings'}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-bar">
        <div className="filter-group">
          <Search size={16} className="filter-icon" />
          <input
            type="text"
            className="filter-input"
            placeholder={language === 'hi' ? 'फसल खोजें (उदा. गेहूं, धान)...' : 'Search crop (e.g. Wheat, Rice)...'}
            value={filters.crop}
            onChange={(e) => setFilters({ ...filters, crop: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <input
            type="text"
            className="filter-input"
            placeholder={language === 'hi' ? 'राज्य से खोजें...' : 'Filter by State...'}
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <input
            type="text"
            className="filter-input"
            placeholder={language === 'hi' ? 'ज़िला से खोजें...' : 'Filter by District...'}
            value={filters.district}
            onChange={(e) => setFilters({ ...filters, district: e.target.value })}
          />
        </div>

        <div className="filter-group select-group">
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">{language === 'hi' ? 'सभी स्थितियां' : 'All Statuses'}</option>
            <option value="available">{language === 'hi' ? 'उपलब्ध' : 'Available'}</option>
            <option value="reserved">{language === 'hi' ? 'आरक्षित' : 'Reserved'}</option>
            <option value="sold">{language === 'hi' ? 'बिक चुका' : 'Sold'}</option>
            <option value="cancelled">{language === 'hi' ? 'रद्द' : 'Cancelled'}</option>
          </select>
        </div>
      </div>

      {/* Harvests List */}
      <div className="content-card">
        <div className="card-header-bar">
          <h3>{language === 'hi' ? `सक्रिय सूचियां (${totalCount})` : `Active Listings (${totalCount})`}</h3>
        </div>

        {loading ? (
          <div className="loading-state">
            <RefreshCw size={24} className="spin" />
            <p>{language === 'hi' ? 'फसल सूचियां लोड हो रही हैं...' : 'Loading harvest listings...'}</p>
          </div>
        ) : harvests.length === 0 ? (
          <div className="empty-state">
            <Package size={48} className="empty-icon" />
            <h4>{language === 'hi' ? 'कोई फसल सूची नहीं मिली' : 'No harvest listings found'}</h4>
            <p>{language === 'hi' ? 'फ़िल्टर साफ़ करें या ऊपर बटन दबाकर नई फसल सूची बनाएं।' : 'Try clearing your filters or create a new harvest listing above.'}</p>
            <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> {language === 'hi' ? 'पहली फसल सूची बनाएं' : 'Create First Listing'}
            </button>
          </div>
        ) : (
          <div className="listings-grid">
            {harvests.map((h) => {
              const isSoldOrReserved = h.status === 'reserved' || h.status === 'sold';
              const statusClass =
                h.status === 'available'
                  ? 'badge-success'
                  : isSoldOrReserved
                  ? 'badge-success'
                  : 'badge-neutral';
              return (
                <div
                  key={h.id}
                  className="harvest-card"
                  style={isSoldOrReserved ? { border: '2px solid #10b981', background: '#f0fdf4', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)' } : {}}
                >
                  <div className="harvest-card-top">
                    <span
                      className={`status-badge ${statusClass}`}
                      style={isSoldOrReserved ? { background: '#059669', color: '#ffffff', fontWeight: 750 } : {}}
                    >
                      {isSoldOrReserved ? (language === 'hi' ? '✅ बिक चुका / आरक्षित' : '✅ SOLD / RESERVED') : h.status?.toUpperCase()}
                    </span>
                    <span className="harvest-id">{language === 'hi' ? `सूची #${h.id}` : `Listing #${h.id}`}</span>
                  </div>

                  <h4 className="harvest-crop-name">{h.crop}</h4>

                  {isSoldOrReserved && (
                    <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '6px', padding: '6px 10px', fontSize: '0.8rem', color: '#166534', fontWeight: 650, marginBottom: '0.75rem' }}>
                      {language === 'hi'
                        ? 'विजेता खरीदार बोली स्वीकृत! 100% एस्क्रो राशि सुरक्षित। खेत से उठान प्रतीक्षित।'
                        : 'Winning buyer bid accepted! 100% Escrow deposit locked. Awaiting farm-gate collection.'}
                    </div>
                  )}

                  <div className="harvest-details-grid">
                    <div className="detail-item">
                      <span className="detail-label">{language === 'hi' ? 'मात्रा' : 'Quantity'}</span>
                      <strong className="detail-val">{Number(h.quantity_kg).toLocaleString()} kg</strong>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">{t('qualityGrade')}</span>
                      <strong className="detail-val">{h.quality_grade || 'Standard'}</strong>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">{language === 'hi' ? 'अनुमानित दिनांक' : 'Expected Date'}</span>
                      <span className="detail-val-date">
                        <Calendar size={14} /> {h.expected_harvest_date}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">{language === 'hi' ? 'स्थान' : 'Farm / Location'}</span>
                      <span className="detail-val-loc">
                        {h.district || 'Ludhiana'}, {h.state || 'Punjab'}
                      </span>
                    </div>
                  </div>

                  <div className="harvest-card-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleOpenCompare(h)}
                    >
                      <TrendingUp size={14} />
                      <span>
                        {isSoldOrReserved
                          ? (language === 'hi' ? 'अनुबंध व बोलियां देखें' : 'View Contract / Bids')
                          : ((h.farmer_id && Number(h.farmer_id) === Number(userId)) || (Number(h.farm_id) === Number(farmId) && Number(userId) === Number(h.farmer_id || 1)))
                          ? (language === 'hi' ? 'प्राप्त बोलियां देखें' : 'View Received Bids')
                          : (language === 'hi' ? 'बोलियों की तुलना करें' : 'Compare Offers')}
                      </span>
                    </button>

                    {h.status === 'available' && (
                      ((h.farmer_id && Number(h.farmer_id) === Number(userId)) || (Number(h.farm_id) === Number(farmId) && Number(userId) === Number(h.farmer_id || 1))) ? (
                        <span
                          className="badge-tag"
                          style={{
                            background: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '6px',
                            whiteSpace: 'nowrap',
                          }}
                          title={language === 'hi' ? 'यह आपकी अपनी फसल सूची है' : 'You listed this harvest'}
                        >
                          {language === 'hi' ? 'आपकी अपनी सूची' : 'Your Listing'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setShowOfferModal(h);
                            setOfferForm((prev) => ({
                              ...prev,
                              buyer_id: userId,
                              price_per_kg: 28.5,
                              transport_cost: 0,
                              other_costs: 0,
                            }));
                          }}
                        >
                          <DollarSign size={14} />
                          <span>{language === 'hi' ? 'बोली लगाएं' : 'Place Bid'}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE HARVEST MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <div className="modal-header">
              <h3>{language === 'hi' ? 'नई फसल सूची बनाएं' : 'Create New Harvest Listing'}</h3>
              <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateHarvest}>
              <div className="modal-body">
                <div className="modal-helper-row" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="helper-text" style={{ color: '#166534', fontWeight: 650, fontSize: '0.85rem' }}>
                    {language === 'hi' ? 'खेत: गोल्डन फील्ड्स एग्री फार्म • लुधियाना, पंजाब' : 'Farm: Golden Fields Agri Farm • Ludhiana, Punjab'}
                  </span>
                  <button type="button" className="btn-link" onClick={fillSampleHarvest}>
                    {language === 'hi' ? 'गेहूं का नमूना भरें' : 'Fill Sample Wheat'}
                  </button>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>{language === 'hi' ? 'फसल की किस्म / नाम' : 'Crop Variety / Name'}</label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'hi' ? 'उदा. शरबती गेहूं, बासमती धान' : 'e.g. Sharbati Wheat, Basmati Rice'}
                    value={harvestForm.crop}
                    onChange={(e) => setHarvestForm({ ...harvestForm, crop: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{language === 'hi' ? 'मात्रा (किग्रा)' : 'Quantity (kg)'}</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={harvestForm.quantity_kg}
                      onChange={(e) => setHarvestForm({ ...harvestForm, quantity_kg: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>{language === 'hi' ? 'गुणवत्ता ग्रेड (वैकल्पिक)' : 'Quality Grade (optional)'}</label>
                    <input
                      type="text"
                      placeholder={language === 'hi' ? 'उदा. ग्रेड A, एफएक्यू' : 'e.g. Grade A, FAQ'}
                      value={harvestForm.quality_grade}
                      onChange={(e) => setHarvestForm({ ...harvestForm, quality_grade: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{language === 'hi' ? 'अनुमानित कटाई तिथि' : 'Expected Harvest Date'}</label>
                  <input
                    type="date"
                    required
                    value={harvestForm.expected_harvest_date}
                    onChange={(e) => setHarvestForm({ ...harvestForm, expected_harvest_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary">
                  {language === 'hi' ? 'सूची प्रकाशित करें' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMIT BUYER OFFER MODAL */}
      {showOfferModal && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <div className="modal-header">
              <h3>
                {language === 'hi' ? `खरीद बोली दर्ज करें: ${showOfferModal.crop}` : `Submit Buyer Bid for ${showOfferModal.crop}`}
              </h3>
              <button type="button" className="btn-close" onClick={() => setShowOfferModal(null)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitOffer}>
              <div className="modal-body">
                <div className="info-banner" style={{ marginBottom: '1rem' }}>
                  <Tag size={16} />
                  <span>
                    {language === 'hi'
                      ? `सूची #${showOfferModal.id} • कुल ${Number(showOfferModal.quantity_kg).toLocaleString()} किग्रा`
                      : `Listing #${showOfferModal.id} • ${Number(showOfferModal.quantity_kg).toLocaleString()} kg total`}
                  </span>
                </div>

                {/* Self-Bidding Warning */}
                {((showOfferModal.farmer_id && Number(showOfferModal.farmer_id) === Number(userId)) || (Number(showOfferModal.farm_id) === Number(farmId) && Number(userId) === Number(showOfferModal.farmer_id || 1))) ? (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', color: '#991b1b', fontSize: '0.86rem', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} />
                    <span>
                      {language === 'hi'
                        ? 'आप इस फसल के विक्रेता किसान हैं। किसान अपनी ही फसल सूची पर खरीद बोली नहीं लगा सकते।'
                        : 'You are the listing farmer for this harvest. Market integrity prevents self-bidding on your own crops.'}
                    </span>
                  </div>
                ) : (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 12px', marginBottom: '1rem', fontSize: '0.84rem', color: '#1e40af', fontWeight: 600 }}>
                    {language === 'hi'
                      ? `बोलीकर्ता: ${userProfile?.name || 'उपज खरीदार'} (एस्क्रो सुरक्षित)`
                      : `Bidding as: ${userProfile?.name || 'Produce Buyer'} (Escrow Protected)`}
                  </div>
                )}

                <div className="form-group">
                  <label>{language === 'hi' ? 'प्रस्तावित बोली दर (₹/किग्रा)' : 'Offered Bid Price (₹/kg)'}</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    required
                    value={offerForm.price_per_kg}
                    onChange={(e) => setOfferForm({ ...offerForm, price_per_kg: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{language === 'hi' ? 'परिवहन लागत (₹)' : 'Transport Cost (₹)'}</label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={offerForm.transport_cost}
                      onChange={(e) => setOfferForm({ ...offerForm, transport_cost: e.target.value })}
                    />
                    <span className="subtext">
                      {language === 'hi' ? 'यदि खरीदार परिवहन खर्च वहन करता है तो 0 रखें' : '0 if buyer absorbs all transport costs'}
                    </span>
                  </div>

                  <div className="form-group">
                    <label>{language === 'hi' ? 'अन्य लॉजिस्टिक्स लागत (₹)' : 'Other Logistics Costs (₹)'}</label>
                    <input
                      type="number"
                      step="25"
                      min="0"
                      value={offerForm.other_costs}
                      onChange={(e) => setOfferForm({ ...offerForm, other_costs: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOfferModal(null)}>
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={Boolean((showOfferModal.farmer_id && Number(showOfferModal.farmer_id) === Number(userId)) || (Number(showOfferModal.farm_id) === Number(farmId) && Number(userId) === Number(showOfferModal.farmer_id || 1)))}
                >
                  <Send size={16} /> {language === 'hi' ? 'बोली जमा करें' : 'Submit Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPARE OFFERS MODAL */}
      {showCompareModal && (
        <div className="modal-backdrop">
          <div className="modal-window modal-wide">
            <div className="modal-header">
              <div>
                <h3>{language === 'hi' ? 'शुद्ध आय तुलना एवं रैंकिंग' : 'Net Earnings Comparison'}</h3>
                <span className="text-muted">
                  {language === 'hi'
                    ? `फसल #${showCompareModal.id}: ${showCompareModal.crop} (${Number(showCompareModal.quantity_kg).toLocaleString()} किग्रा)`
                    : `Harvest #${showCompareModal.id}: ${showCompareModal.crop} (${Number(showCompareModal.quantity_kg).toLocaleString()} kg)`}
                </span>
              </div>
              <button type="button" className="btn-close" onClick={() => setShowCompareModal(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {loadingCompare ? (
                <div className="loading-state">
                  <RefreshCw size={24} className="spin" />
                  <p>{language === 'hi' ? 'प्रस्तावों की शुद्ध आय की गणना हो रही है...' : 'Calculating net proceeds for offers...'}</p>
                </div>
              ) : !compareData || !compareData.offers || compareData.offers.length === 0 ? (
                <div className="empty-state">
                  <AlertCircle size={40} className="empty-icon" />
                  <h4>{language === 'hi' ? 'अभी कोई खरीदार बोली नहीं मिली' : 'No Buyer Offers Yet'}</h4>
                  <p>{language === 'hi' ? 'मार्केटप्लेस में खरीदार के रूप में बोली लगाएं ताकि शुद्ध आय गणना देखी जा सके।' : 'Switch your role to "Produce Buyer" and place a bid to see net calculation in action.'}</p>
                </div>
              ) : (
                <div className="comparison-table-wrapper">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>{language === 'hi' ? 'रैंक' : 'Rank'}</th>
                        <th>{language === 'hi' ? 'खरीदार' : 'Buyer'}</th>
                        <th>{language === 'hi' ? 'बोली (₹/किग्रा)' : 'Bid (₹/kg)'}</th>
                        <th>{language === 'hi' ? 'सकल मूल्य' : 'Gross Value'}</th>
                        <th>{language === 'hi' ? 'कटौतियां' : 'Deductions'}</th>
                        <th>{language === 'hi' ? 'अनुमानित शुद्ध आय' : 'Est. Net Proceeds'}</th>
                        <th>{language === 'hi' ? 'स्थिति' : 'Status'}</th>
                        <th>{language === 'hi' ? 'कार्रवाई' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compareData.offers.map((item, idx) => {
                        const isAccepted = item.status === 'accepted';
                        const isPending = item.status === 'pending';
                        return (
                          <tr key={item.offer_id} className={isAccepted ? 'row-highlight' : ''}>
                            <td>
                              <span className="rank-badge">#{idx + 1}</span>
                            </td>
                            <td>
                              <strong>{item.buyer_name || (language === 'hi' ? `खरीदार #${item.buyer_id}` : `Buyer #${item.buyer_id}`)}</strong>
                            </td>
                            <td>₹{Number(item.price_per_kg).toFixed(2)}</td>
                            <td>₹{Number(item.gross_value).toLocaleString()}</td>
                            <td className="text-danger">-₹{Number(item.total_costs).toLocaleString()}</td>
                            <td className="text-success font-bold">
                              ₹{Number(item.estimated_net).toLocaleString()}
                            </td>
                            <td>
                              <span className={`status-pill-sm ${item.status}`}>
                                {item.status === 'accepted' ? (language === 'hi' ? 'स्वीकृत' : 'accepted') : item.status === 'pending' ? (language === 'hi' ? 'लंबित' : 'pending') : item.status}
                              </span>
                            </td>
                            <td>
                              {isPending ? (
                                <div className="action-buttons-inline">
                                  <button
                                    type="button"
                                    className="btn-icon-action btn-accept"
                                    title={language === 'hi' ? 'बोली स्वीकार करें और फसल आरक्षित करें' : 'Accept this offer and reserve harvest'}
                                    onClick={() => handleUpdateOfferStatus(item.offer_id, 'accepted')}
                                  >
                                    <CheckCircle size={16} /> {language === 'hi' ? 'स्वीकारें' : 'Accept'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-icon-action btn-reject"
                                    title={language === 'hi' ? 'बोली अस्वीकार करें' : 'Reject offer'}
                                    onClick={() => handleUpdateOfferStatus(item.offer_id, 'rejected')}
                                  >
                                    <XCircle size={16} />
                                  </button>
                                </div>
                              ) : (
                                <span className="decision-label">{item.status === 'accepted' ? (language === 'hi' ? 'स्वीकृत' : 'accepted') : item.status}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCompareModal(null)}>
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
