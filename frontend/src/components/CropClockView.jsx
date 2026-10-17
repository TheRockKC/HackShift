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
  const { userId, farmId, showToast } = useApp();

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
      await cropclockApi.createHarvest({
        farmer_id: Number(harvestForm.farmer_id),
        farm_id: Number(harvestForm.farm_id),
        crop: harvestForm.crop.trim(),
        quantity_kg: Number(harvestForm.quantity_kg),
        expected_harvest_date: harvestForm.expected_harvest_date,
        quality_grade: harvestForm.quality_grade ? harvestForm.quality_grade.trim() : null,
      });
      showToast('Harvest listing created successfully!', 'success');
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
    try {
      await cropclockApi.submitOffer(showOfferModal.id, {
        buyer_id: Number(offerForm.buyer_id),
        price_per_kg: Number(offerForm.price_per_kg),
        transport_cost: Number(offerForm.transport_cost || 0),
        other_costs: Number(offerForm.other_costs || 0),
      });
      showToast('Buyer offer submitted successfully!', 'success');
      setShowOfferModal(null);
      fetchHarvests();
    } catch (err) {
      showToast(`Error submitting offer: ${err.message}`, 'error');
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
      await cropclockApi.updateOfferStatus(offerId, newStatus, userId);
      showToast(`Offer ${newStatus} successfully!`, 'success');
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
            <h2 className="view-title">CropClock Marketplace</h2>
            <p className="view-desc">
              List future crop harvests, receive transparent buyer bids, and rank offers by true net earnings after transport deductions.
            </p>
          </div>
        </div>

        <div className="view-actions">
          <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            <span>List Harvest</span>
          </button>
          <button type="button" className="btn btn-outline" onClick={fetchHarvests} title="Refresh listings">
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
            placeholder="Search crop (e.g. Wheat, Rice)..."
            value={filters.crop}
            onChange={(e) => setFilters({ ...filters, crop: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <input
            type="text"
            className="filter-input"
            placeholder="Filter by State..."
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <input
            type="text"
            className="filter-input"
            placeholder="Filter by District..."
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
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Harvests List */}
      <div className="content-card">
        <div className="card-header-bar">
          <h3>Active Listings ({totalCount})</h3>
        </div>

        {loading ? (
          <div className="loading-state">
            <RefreshCw size={24} className="spin" />
            <p>Loading harvest listings...</p>
          </div>
        ) : harvests.length === 0 ? (
          <div className="empty-state">
            <Package size={48} className="empty-icon" />
            <h4>No harvest listings found</h4>
            <p>Try clearing your filters or create a new harvest listing above.</p>
            <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Create First Listing
            </button>
          </div>
        ) : (
          <div className="listings-grid">
            {harvests.map((h) => {
              const statusClass =
                h.status === 'available'
                  ? 'badge-success'
                  : h.status === 'reserved'
                  ? 'badge-warning'
                  : 'badge-neutral';
              return (
                <div key={h.id} className="harvest-card">
                  <div className="harvest-card-top">
                    <span className={`status-badge ${statusClass}`}>{h.status?.toUpperCase()}</span>
                    <span className="harvest-id">Listing #{h.id}</span>
                  </div>

                  <h4 className="harvest-crop-name">{h.crop}</h4>

                  <div className="harvest-details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Quantity</span>
                      <strong className="detail-val">{Number(h.quantity_kg).toLocaleString()} kg</strong>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Quality Grade</span>
                      <strong className="detail-val">{h.quality_grade || 'Standard'}</strong>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Expected Date</span>
                      <span className="detail-val-date">
                        <Calendar size={14} /> {h.expected_harvest_date}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Farm / Location</span>
                      <span className="detail-val-loc">
                        {h.district || 'Ludhiana'}, {h.state || 'Punjab'}
                      </span>
                    </div>
                  </div>

                  <div className="harvest-card-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleOpenCompare(h)}
                    >
                      <TrendingUp size={14} />
                      <span>Compare Offers</span>
                    </button>

                    {h.status === 'available' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setShowOfferModal(h);
                          setOfferForm((prev) => ({
                            ...prev,
                            price_per_kg: 28.5,
                            transport_cost: 0,
                            other_costs: 0,
                          }));
                        }}
                      >
                        <DollarSign size={14} />
                        <span>Place Bid</span>
                      </button>
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
              <h3>Create New Harvest Listing</h3>
              <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateHarvest}>
              <div className="modal-body">
                <div className="modal-helper-row">
                  <span className="helper-text">Farmer ID #{harvestForm.farmer_id} • Farm ID #{harvestForm.farm_id}</span>
                  <button type="button" className="btn-link" onClick={fillSampleHarvest}>
                    Fill Sample Wheat
                  </button>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Farmer User ID</label>
                    <input
                      type="number"
                      required
                      value={harvestForm.farmer_id}
                      onChange={(e) => setHarvestForm({ ...harvestForm, farmer_id: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Farm ID</label>
                    <input
                      type="number"
                      required
                      value={harvestForm.farm_id}
                      onChange={(e) => setHarvestForm({ ...harvestForm, farm_id: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Crop Variety / Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharbati Wheat, Basmati Rice"
                    value={harvestForm.crop}
                    onChange={(e) => setHarvestForm({ ...harvestForm, crop: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity (kg)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={harvestForm.quantity_kg}
                      onChange={(e) => setHarvestForm({ ...harvestForm, quantity_kg: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Quality Grade (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Grade A, FAQ"
                      value={harvestForm.quality_grade}
                      onChange={(e) => setHarvestForm({ ...harvestForm, quality_grade: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Expected Harvest Date</label>
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
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Listing
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
              <h3>Submit Buyer Bid for {showOfferModal.crop}</h3>
              <button type="button" className="btn-close" onClick={() => setShowOfferModal(null)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitOffer}>
              <div className="modal-body">
                <div className="info-banner">
                  <Tag size={16} />
                  <span>
                    Listing #{showOfferModal.id} • {Number(showOfferModal.quantity_kg).toLocaleString()} kg total
                  </span>
                </div>

                <div className="form-group">
                  <label>Buyer User ID (buyer role)</label>
                  <input
                    type="number"
                    required
                    value={offerForm.buyer_id}
                    onChange={(e) => setOfferForm({ ...offerForm, buyer_id: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Offered Bid Price (₹/kg)</label>
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
                    <label>Transport Cost (₹)</label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={offerForm.transport_cost}
                      onChange={(e) => setOfferForm({ ...offerForm, transport_cost: e.target.value })}
                    />
                    <span className="subtext">0 if buyer absorbs all transport costs</span>
                  </div>

                  <div className="form-group">
                    <label>Other Logistics Costs (₹)</label>
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
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Send size={16} /> Submit Bid
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
                <h3>Net Earnings Comparison</h3>
                <span className="text-muted">
                  Harvest #{showCompareModal.id}: {showCompareModal.crop} ({Number(showCompareModal.quantity_kg).toLocaleString()} kg)
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
                  <p>Calculating net proceeds for offers...</p>
                </div>
              ) : !compareData || !compareData.offers || compareData.offers.length === 0 ? (
                <div className="empty-state">
                  <AlertCircle size={40} className="empty-icon" />
                  <h4>No Buyer Offers Yet</h4>
                  <p>Switch your role to "Produce Buyer" and place a bid to see net calculation in action.</p>
                </div>
              ) : (
                <div className="comparison-table-wrapper">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Buyer</th>
                        <th>Bid (₹/kg)</th>
                        <th>Gross Value</th>
                        <th>Deductions</th>
                        <th>Est. Net Proceeds</th>
                        <th>Status</th>
                        <th>Action</th>
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
                              <strong>{item.buyer_name || `Buyer #${item.buyer_id}`}</strong>
                            </td>
                            <td>₹{Number(item.price_per_kg).toFixed(2)}</td>
                            <td>₹{Number(item.gross_value).toLocaleString()}</td>
                            <td className="text-danger">-₹{Number(item.total_costs).toLocaleString()}</td>
                            <td className="text-success font-bold">
                              ₹{Number(item.estimated_net).toLocaleString()}
                            </td>
                            <td>
                              <span className={`status-pill-sm ${item.status}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>
                              {isPending ? (
                                <div className="action-buttons-inline">
                                  <button
                                    type="button"
                                    className="btn-icon-action btn-accept"
                                    title="Accept this offer and reserve harvest"
                                    onClick={() => handleUpdateOfferStatus(item.offer_id, 'accepted')}
                                  >
                                    <CheckCircle size={16} /> Accept
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-icon-action btn-reject"
                                    title="Reject offer"
                                    onClick={() => handleUpdateOfferStatus(item.offer_id, 'rejected')}
                                  >
                                    <XCircle size={16} />
                                  </button>
                                </div>
                              ) : (
                                <span className="decision-label">{item.status}</span>
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
