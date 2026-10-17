import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { campsApi } from '../api/client';
import {
  Tent,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Sparkles,
  RefreshCw,
  Tag,
  AlertCircle,
} from 'lucide-react';

export default function CampsView() {
  const { userId, showToast } = useApp();

  const [camps, setCamps] = useState([]);
  const [nextCamp, setNextCamp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    state: '',
    district: '',
    include_past: false,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Dates Helper for camp inputs
  const getCampDateIso = (daysFromNow, hour) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Create Camp Form
  const [campForm, setCampForm] = useState({
    coordinator_id: userId,
    title: 'Digital Farming & PM-KISAN e-KYC Drive',
    description:
      'Hands-on training for farmers on using the AnnData app, completing biometric/OTP e-KYC on PM-KISAN, and accessing custom hiring centers.',
    scheduled_start: getCampDateIso(5, 10),
    scheduled_end: getCampDateIso(5, 16),
    venue: 'Panchayat Bhavan Hall',
    village: 'Doraha',
    district: 'Ludhiana',
    state: 'Punjab',
    topics: 'Digital Literacy, PM-KISAN e-KYC, Crop Insurance, Precision Irrigation',
    contact_person: 'Sardar Gurpreet Singh',
    contact_phone: '+91 98765 43210',
  });

  // Sync userId
  useEffect(() => {
    setCampForm((prev) => ({ ...prev, coordinator_id: userId }));
  }, [userId]);

  // Fetch Camps and Next Camp
  const fetchCamps = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, nextRes] = await Promise.allSettled([
        campsApi.getCamps(filters),
        campsApi.getNextCamp({ state: filters.state, district: filters.district }),
      ]);

      if (listRes.status === 'fulfilled') {
        setCamps(listRes.value.items || []);
        setTotalCount(listRes.value.total || 0);
      } else {
        showToast(`Failed to load camps: ${listRes.reason.message}`, 'error');
      }

      if (nextRes.status === 'fulfilled') {
        setNextCamp(nextRes.value);
      } else {
        setNextCamp(null); // No upcoming camp or 404
      }
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    fetchCamps();
  }, [fetchCamps]);

  // Convert input datetime-local string to timezone-aware ISO string
  const toTzAwareIso = (localDtStr) => {
    const dateObj = new Date(localDtStr);
    return dateObj.toISOString();
  };

  // Handle Create Camp
  const handleCreateCamp = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        coordinator_id: Number(campForm.coordinator_id),
        title: campForm.title,
        description: campForm.description,
        scheduled_start: toTzAwareIso(campForm.scheduled_start),
        scheduled_end: toTzAwareIso(campForm.scheduled_end),
        venue: campForm.venue,
        village: campForm.village,
        district: campForm.district,
        state: campForm.state,
        topics: campForm.topics,
        contact_person: campForm.contact_person,
        contact_phone: campForm.contact_phone,
      };

      await campsApi.createCamp(payload);
      showToast('Digital literacy camp scheduled successfully!', 'success');
      setShowCreateModal(false);
      fetchCamps();
    } catch (err) {
      showToast(`Error scheduling camp: ${err.message}`, 'error');
    }
  };

  const fillSampleCamp = () => {
    setCampForm({
      coordinator_id: userId,
      title: 'Kisan Doot Smart Agriculture Workshop',
      description:
        'Demonstration of precision water scheduling, FairQueue machinery booking, and direct harvest price negotiation with vetted mill buyers.',
      scheduled_start: getCampDateIso(7, 9),
      scheduled_end: getCampDateIso(7, 15),
      venue: 'Krishi Vigyan Kendra (KVK) Auditorium',
      village: 'Samrala',
      district: 'Ludhiana',
      state: 'Punjab',
      topics: 'Water Saving, Drone Spraying, Mobile Banking, Soil Health Card',
      contact_person: 'Dr. Hardeep Sandhu',
      contact_phone: '+91 98123 45678',
    });
  };

  return (
    <div className="module-view-container">
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-block">
          <div className="view-icon-badge bg-amber">
            <Tent size={24} />
          </div>
          <div>
            <h2 className="view-title">FarmConnect Literacy Camps</h2>
            <p className="view-desc">
              Discover village workshops, digital agriculture awareness camps, and government scheme enrollment sessions.
            </p>
          </div>
        </div>

        <div className="view-actions">
          <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            <span>Schedule Camp</span>
          </button>
          <button type="button" className="btn btn-outline" onClick={fetchCamps} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* NEXT UPCOMING CAMP SPOTLIGHT */}
      {nextCamp && (
        <section className="next-camp-spotlight">
          <div className="spotlight-tag">
            <Sparkles size={16} /> Earliest Upcoming Camp
          </div>
          <div className="spotlight-content">
            <div className="spotlight-main">
              <h3 className="spotlight-title">{nextCamp.title}</h3>
              <p className="spotlight-desc">{nextCamp.description}</p>

              <div className="spotlight-meta-grid">
                <div className="meta-card">
                  <Calendar size={16} className="text-amber" />
                  <div>
                    <span className="meta-card-label">Date & Timing</span>
                    <strong className="meta-card-val">
                      {new Date(nextCamp.scheduled_start).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' - '}
                      {new Date(nextCamp.scheduled_end).toLocaleString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </div>
                </div>

                <div className="meta-card">
                  <MapPin size={16} className="text-amber" />
                  <div>
                    <span className="meta-card-label">Location / Venue</span>
                    <strong className="meta-card-val">
                      {nextCamp.venue}, {nextCamp.village}, {nextCamp.district}
                    </strong>
                  </div>
                </div>

                <div className="meta-card">
                  <User size={16} className="text-amber" />
                  <div>
                    <span className="meta-card-label">Coordinator</span>
                    <strong className="meta-card-val">
                      {nextCamp.contact_person} ({nextCamp.contact_phone})
                    </strong>
                  </div>
                </div>
              </div>

              {nextCamp.topics && (
                <div className="topics-pills-row">
                  {nextCamp.topics.split(',').map((t, idx) => (
                    <span key={idx} className="topic-pill">
                      <Tag size={12} /> {t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Filters Toolbar */}
      <div className="filter-bar">
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
          <Search size={16} className="filter-icon" />
          <input
            type="text"
            className="filter-input"
            placeholder="Filter by District..."
            value={filters.district}
            onChange={(e) => setFilters({ ...filters, district: e.target.value })}
          />
        </div>

        <div className="filter-group checkbox-filter">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.include_past}
              onChange={(e) => setFilters({ ...filters, include_past: e.target.checked })}
            />
            <span>Include Past Camps</span>
          </label>
        </div>
      </div>

      {/* Camps List */}
      <div className="content-card">
        <div className="card-header-bar">
          <h3>Camp Schedule ({totalCount})</h3>
        </div>

        {loading ? (
          <div className="loading-state">
            <RefreshCw size={24} className="spin" />
            <p>Loading camps directory...</p>
          </div>
        ) : camps.length === 0 ? (
          <div className="empty-state">
            <Tent size={48} className="empty-icon" />
            <h4>No scheduled camps match your search</h4>
            <p>Switch your role to "Coordinator / Admin" and schedule a camp in your district.</p>
            <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Schedule First Camp
            </button>
          </div>
        ) : (
          <div className="camps-grid">
            {camps.map((camp) => (
              <div key={camp.id} className="camp-card">
                <div className="camp-card-header">
                  <span className="camp-id-tag">Camp #{camp.id}</span>
                  <span className="camp-timing">
                    <Clock size={14} />{' '}
                    {new Date(camp.scheduled_start).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h4 className="camp-title">{camp.title}</h4>
                <p className="camp-desc">{camp.description}</p>

                <div className="camp-venue-box">
                  <MapPin size={14} className="text-amber" />
                  <span>
                    {camp.venue}, {camp.village}, {camp.district}, {camp.state}
                  </span>
                </div>

                <div className="camp-contact-box">
                  <Phone size={14} />
                  <span>
                    {camp.contact_person} • {camp.contact_phone}
                  </span>
                </div>

                {camp.topics && (
                  <div className="camp-topics-list">
                    {camp.topics.split(',').map((t, idx) => (
                      <span key={idx} className="topic-pill-sm">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SCHEDULE CAMP MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <div className="modal-header">
              <h3>Schedule FarmConnect Camp</h3>
              <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCamp}>
              <div className="modal-body">
                <div className="modal-helper-row">
                  <span className="helper-text">Coordinator ID #{campForm.coordinator_id} (Admin role)</span>
                  <button type="button" className="btn-link" onClick={fillSampleCamp}>
                    Fill Sample Workshop
                  </button>
                </div>

                <div className="form-group">
                  <label>Coordinator User ID</label>
                  <input
                    type="number"
                    required
                    value={campForm.coordinator_id}
                    onChange={(e) => setCampForm({ ...campForm, coordinator_id: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Camp Title</label>
                  <input
                    type="text"
                    required
                    value={campForm.title}
                    onChange={(e) => setCampForm({ ...campForm, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Description & Objectives</label>
                  <textarea
                    rows={3}
                    required
                    value={campForm.description}
                    onChange={(e) => setCampForm({ ...campForm, description: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={campForm.scheduled_start}
                      onChange={(e) => setCampForm({ ...campForm, scheduled_start: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={campForm.scheduled_end}
                      onChange={(e) => setCampForm({ ...campForm, scheduled_end: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Venue / Building</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Panchayat Bhavan"
                      value={campForm.venue}
                      onChange={(e) => setCampForm({ ...campForm, venue: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Village</label>
                    <input
                      type="text"
                      required
                      value={campForm.village}
                      onChange={(e) => setCampForm({ ...campForm, village: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>District</label>
                    <input
                      type="text"
                      required
                      value={campForm.district}
                      onChange={(e) => setCampForm({ ...campForm, district: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      required
                      value={campForm.state}
                      onChange={(e) => setCampForm({ ...campForm, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Topics Covered (comma separated)</label>
                  <input
                    type="text"
                    required
                    value={campForm.topics}
                    onChange={(e) => setCampForm({ ...campForm, topics: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input
                      type="text"
                      required
                      value={campForm.contact_person}
                      onChange={(e) => setCampForm({ ...campForm, contact_person: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={campForm.contact_phone}
                      onChange={(e) => setCampForm({ ...campForm, contact_phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Camp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
