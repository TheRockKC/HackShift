import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { fairqueueApi } from '../api/client';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  CalendarCheck,
} from 'lucide-react';

export default function FairQueueView() {
  const { userId, showToast } = useApp();

  const [machineryList, setMachineryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    equipment_type: '',
    state: '',
    district: '',
    is_available: 'all',
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(null); // machinery obj
  const [showBookingsListModal, setShowBookingsListModal] = useState(null); // machinery obj
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Create Machinery Form
  const [machineryForm, setMachineryForm] = useState({
    provider_id: userId,
    equipment_type: 'tractor',
    name: 'Mahindra 575 DI (45 HP)',
    hourly_rate: 650.0,
    daily_rate: 4500.0,
    state: 'Punjab',
    district: 'Ludhiana',
  });

  // Format Helper for local datetime input
  const getTomorrowIso = (hour) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Booking Form
  const [bookingForm, setBookingForm] = useState({
    farmer_id: userId,
    start_time: getTomorrowIso(9),
    end_time: getTomorrowIso(13),
  });

  // Sync userId
  useEffect(() => {
    setMachineryForm((prev) => ({ ...prev, provider_id: userId }));
    setBookingForm((prev) => ({ ...prev, farmer_id: userId }));
  }, [userId]);

  // Load Machinery
  const fetchMachinery = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fairqueueApi.getMachinery(filters);
      setMachineryList(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      showToast(`Failed to load machinery: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    fetchMachinery();
  }, [fetchMachinery]);

  // Handle Create Machinery
  const handleCreateMachinery = async (e) => {
    e.preventDefault();
    try {
      await fairqueueApi.createMachinery({
        provider_id: Number(machineryForm.provider_id),
        equipment_type: machineryForm.equipment_type,
        name: machineryForm.name,
        hourly_rate: Number(machineryForm.hourly_rate),
        daily_rate: Number(machineryForm.daily_rate),
        state: machineryForm.state,
        district: machineryForm.district,
      });
      showToast('Machinery listed on FairQueue successfully!', 'success');
      setShowCreateModal(false);
      fetchMachinery();
    } catch (err) {
      showToast(`Error adding machinery: ${err.message}`, 'error');
    }
  };

  // Convert input datetime-local string to timezone-aware ISO string
  const toTzAwareIso = (localDtStr) => {
    const dateObj = new Date(localDtStr);
    return dateObj.toISOString();
  };

  // Handle Create Booking
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!showBookingModal) return;

    try {
      const startIso = toTzAwareIso(bookingForm.start_time);
      const endIso = toTzAwareIso(bookingForm.end_time);

      await fairqueueApi.createBooking(showBookingModal.id, {
        farmer_id: Number(bookingForm.farmer_id),
        start_time: startIso,
        end_time: endIso,
      });

      showToast('Machinery booking slot reserved successfully!', 'success');
      setShowBookingModal(null);
      fetchMachinery();
    } catch (err) {
      showToast(`Booking failed: ${err.message}`, 'error');
    }
  };

  // Open Bookings View
  const handleOpenBookingsList = async (item) => {
    setShowBookingsListModal(item);
    setLoadingBookings(true);
    try {
      const data = await fairqueueApi.getBookings(item.id);
      setBookings(data || []);
    } catch (err) {
      showToast(`Error fetching bookings: ${err.message}`, 'error');
    } finally {
      setLoadingBookings(false);
    }
  };

  // Update Booking Status
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await fairqueueApi.updateBookingStatus(bookingId, newStatus, userId);
      showToast(`Booking status updated to ${newStatus}!`, 'success');
      if (showBookingsListModal) {
        handleOpenBookingsList(showBookingsListModal);
      }
      fetchMachinery();
    } catch (err) {
      showToast(`Failed to update booking status: ${err.message}`, 'error');
    }
  };

  const fillSampleTractor = () => {
    setMachineryForm({
      provider_id: userId,
      equipment_type: 'tractor',
      name: 'John Deere 5050 D 4WD',
      hourly_rate: 750.0,
      daily_rate: 5200.0,
      state: 'Punjab',
      district: 'Jalandhar',
    });
  };

  return (
    <div className="module-view-container">
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-block">
          <div className="view-icon-badge bg-blue">
            <Truck size={24} />
          </div>
          <div>
            <h2 className="view-title">FairQueue Machinery Sharing</h2>
            <p className="view-desc">
              Transparent, conflict-free rental scheduler for agricultural implements, tractors, and harvesters.
            </p>
          </div>
        </div>

        <div className="view-actions">
          <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            <span>List Machinery</span>
          </button>
          <button type="button" className="btn btn-outline" onClick={fetchMachinery} title="Refresh">
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
            placeholder="Filter equipment type (e.g. tractor)..."
            value={filters.equipment_type}
            onChange={(e) => setFilters({ ...filters, equipment_type: e.target.value })}
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
            value={filters.is_available}
            onChange={(e) => setFilters({ ...filters, is_available: e.target.value })}
          >
            <option value="all">All Availability</option>
            <option value="true">Available Only</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Machinery Content Grid */}
      <div className="content-card">
        <div className="card-header-bar">
          <h3>Registered Equipment ({totalCount})</h3>
        </div>

        {loading ? (
          <div className="loading-state">
            <RefreshCw size={24} className="spin" />
            <p>Loading machinery inventory...</p>
          </div>
        ) : machineryList.length === 0 ? (
          <div className="empty-state">
            <Truck size={48} className="empty-icon" />
            <h4>No machinery listed yet</h4>
            <p>Add a tractor or combine harvester to enable booking slots.</p>
            <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> List First Machinery
            </button>
          </div>
        ) : (
          <div className="listings-grid">
            {machineryList.map((m) => (
              <div key={m.id} className="machinery-card">
                <div className="harvest-card-top">
                  <span className={`status-badge ${m.is_available ? 'badge-success' : 'badge-neutral'}`}>
                    {m.is_available ? 'AVAILABLE' : 'RESERVED'}
                  </span>
                  <span className="equipment-type-tag">{m.equipment_type.toUpperCase()}</span>
                </div>

                <h4 className="machinery-name">{m.name}</h4>

                <div className="machinery-rates-box">
                  <div className="rate-item">
                    <span className="rate-label">Hourly Rate</span>
                    <strong className="rate-value">
                      {m.hourly_rate ? `₹${Number(m.hourly_rate).toFixed(2)}/hr` : '—'}
                    </strong>
                  </div>
                  <div className="rate-divider" />
                  <div className="rate-item">
                    <span className="rate-label">Daily Rate</span>
                    <strong className="rate-value">
                      {m.daily_rate ? `₹${Number(m.daily_rate).toFixed(2)}/day` : '—'}
                    </strong>
                  </div>
                </div>

                <div className="machinery-location">
                  <MapPin size={14} />
                  <span>
                    {m.district}, {m.state}
                  </span>
                </div>

                <div className="harvest-card-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleOpenBookingsList(m)}
                  >
                    <CalendarCheck size={14} />
                    <span>View Schedule</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={!m.is_available}
                    onClick={() => setShowBookingModal(m)}
                  >
                    <Clock size={14} />
                    <span>Book Slot</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MACHINERY MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <div className="modal-header">
              <h3>List New Farm Machinery</h3>
              <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateMachinery}>
              <div className="modal-body">
                <div className="modal-helper-row">
                  <span className="helper-text">Provider ID #{machineryForm.provider_id}</span>
                  <button type="button" className="btn-link" onClick={fillSampleTractor}>
                    Fill Sample Tractor
                  </button>
                </div>

                <div className="form-group">
                  <label>Provider User ID (machinery_provider role)</label>
                  <input
                    type="number"
                    required
                    value={machineryForm.provider_id}
                    onChange={(e) => setMachineryForm({ ...machineryForm, provider_id: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Equipment Type</label>
                  <select
                    value={machineryForm.equipment_type}
                    onChange={(e) => setMachineryForm({ ...machineryForm, equipment_type: e.target.value })}
                  >
                    <option value="tractor">Tractor</option>
                    <option value="combine_harvester">Combine Harvester</option>
                    <option value="rotavator">Rotavator</option>
                    <option value="seed_drill">Happy Seeder / Seed Drill</option>
                    <option value="power_tiller">Power Tiller</option>
                    <option value="laser_leveler">Laser Land Leveler</option>
                    <option value="sprayer">Boom / Drone Sprayer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Machine Name / Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swaraj 744 FE"
                    value={machineryForm.name}
                    onChange={(e) => setMachineryForm({ ...machineryForm, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Hourly Rate (₹)</label>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={machineryForm.hourly_rate}
                      onChange={(e) => setMachineryForm({ ...machineryForm, hourly_rate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Daily Rate (₹)</label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={machineryForm.daily_rate}
                      onChange={(e) => setMachineryForm({ ...machineryForm, daily_rate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      required
                      value={machineryForm.state}
                      onChange={(e) => setMachineryForm({ ...machineryForm, state: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>District</label>
                    <input
                      type="text"
                      required
                      value={machineryForm.district}
                      onChange={(e) => setMachineryForm({ ...machineryForm, district: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Implement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOK MACHINERY MODAL */}
      {showBookingModal && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <div className="modal-header">
              <h3>Book {showBookingModal.name}</h3>
              <button type="button" className="btn-close" onClick={() => setShowBookingModal(null)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateBooking}>
              <div className="modal-body">
                <div className="info-banner">
                  <Clock size={16} />
                  <span>
                    Machine #{showBookingModal.id} • Rate: ₹{Number(showBookingModal.hourly_rate || 0)}/hr or ₹{Number(showBookingModal.daily_rate || 0)}/day
                  </span>
                </div>

                <div className="form-group">
                  <label>Farmer User ID</label>
                  <input
                    type="number"
                    required
                    value={bookingForm.farmer_id}
                    onChange={(e) => setBookingForm({ ...bookingForm, farmer_id: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>End Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                  />
                </div>

                <p className="subtext-note">
                  FairQueue automatically checks for time-slot conflicts with existing reservations.
                </p>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookingModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Reservation Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOKINGS LIST MODAL */}
      {showBookingsListModal && (
        <div className="modal-backdrop">
          <div className="modal-window modal-wide">
            <div className="modal-header">
              <div>
                <h3>Booking Schedule: {showBookingsListModal.name}</h3>
                <span className="text-muted">Machine ID #{showBookingsListModal.id}</span>
              </div>
              <button type="button" className="btn-close" onClick={() => setShowBookingsListModal(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {loadingBookings ? (
                <div className="loading-state">
                  <RefreshCw size={24} className="spin" />
                  <p>Loading schedule...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={40} className="empty-icon" />
                  <h4>No bookings yet</h4>
                  <p>This equipment is completely free with no scheduled reservations.</p>
                </div>
              ) : (
                <div className="comparison-table-wrapper">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Farmer</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Total Cost</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id}>
                          <td>#{b.id}</td>
                          <td>Farmer #{b.farmer_id}</td>
                          <td>{new Date(b.start_time).toLocaleString()}</td>
                          <td>{new Date(b.end_time).toLocaleString()}</td>
                          <td>₹{Number(b.total_cost || 0).toLocaleString()}</td>
                          <td>
                            <span className={`status-pill-sm ${b.status}`}>{b.status}</span>
                          </td>
                          <td>
                            {b.status === 'pending' && (
                              <div className="action-buttons-inline">
                                <button
                                  type="button"
                                  className="btn-icon-action btn-accept"
                                  onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                                  title="Confirm booking"
                                >
                                  <CheckCircle size={15} /> Confirm
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon-action btn-reject"
                                  onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                  title="Cancel booking"
                                >
                                  <XCircle size={15} /> Cancel
                                </button>
                              </div>
                            )}
                            {b.status === 'confirmed' && (
                              <div className="action-buttons-inline">
                                <button
                                  type="button"
                                  className="btn-icon-action btn-accept"
                                  onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                                  title="Mark as completed"
                                >
                                  <CheckCircle size={15} /> Complete
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon-action btn-reject"
                                  onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                  title="Cancel booking"
                                >
                                  <XCircle size={15} /> Cancel
                                </button>
                              </div>
                            )}
                            {(b.status === 'completed' || b.status === 'cancelled') && (
                              <span className="decision-label">{b.status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowBookingsListModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
