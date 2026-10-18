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
  const { userId, userProfile, showToast, t, language } = useApp();

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
    provider_id: userId || 1,
    equipment_type: 'tractor',
    name: 'Mahindra 575 DI (45 HP)',
    hourly_rate: 650.0,
    daily_rate: 4500.0,
    state: 'Punjab',
    district: 'Ludhiana',
  });

  // Slot Availability Filter (To check or remove booked machinery for reserved time)
  const [slotDateFilter, setSlotDateFilter] = useState('');
  const [slotTimeFilter, setSlotTimeFilter] = useState('all'); // 'all', 'morning', 'afternoon'

  // Booking Form State
  const getTomorrowDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [rentalPlan, setRentalPlan] = useState('hourly'); // 'hourly' | 'daily'
  const [bookingDate, setBookingDate] = useState(getTomorrowDateStr());
  const [bookingStartHour, setBookingStartHour] = useState(8); // 8 AM
  const [rentalHours, setRentalHours] = useState(4);
  const [rentalDays, setRentalDays] = useState(1);

  // Load Machinery with optional slot time interval filtering
  const fetchMachinery = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = { ...filters };
      if (slotDateFilter) {
        if (slotTimeFilter === 'morning') {
          queryParams.start_time = `${slotDateFilter}T08:00:00Z`;
          queryParams.end_time = `${slotDateFilter}T12:00:00Z`;
        } else if (slotTimeFilter === 'afternoon') {
          queryParams.start_time = `${slotDateFilter}T13:00:00Z`;
          queryParams.end_time = `${slotDateFilter}T17:00:00Z`;
        } else {
          queryParams.start_time = `${slotDateFilter}T06:00:00Z`;
          queryParams.end_time = `${slotDateFilter}T20:00:00Z`;
        }
      }
      const res = await fairqueueApi.getMachinery(queryParams);
      setMachineryList(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      showToast(`Failed to load machinery: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, slotDateFilter, slotTimeFilter, showToast]);

  useEffect(() => {
    fetchMachinery();
  }, [fetchMachinery]);

  // Handle Create Machinery
  const handleCreateMachinery = async (e) => {
    e.preventDefault();
    try {
      const activeProviderId = (userId && Number(userId) <= 4 && Number(userId) >= 1) ? Number(userId) : 1;
      await fairqueueApi.createMachinery({
        provider_id: activeProviderId,
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

  // Helper: check if proposed modal slot conflicts with any active reservation
  const getConflictingBooking = () => {
    if (!showBookingModal || !showBookingModal.active_bookings || showBookingModal.active_bookings.length === 0) {
      return null;
    }
    let startMs, endMs;
    if (rentalPlan === 'hourly') {
      const startDt = new Date(`${bookingDate}T${String(bookingStartHour).padStart(2, '0')}:00:00`);
      startMs = startDt.getTime();
      endMs = startMs + rentalHours * 60 * 60 * 1000;
    } else {
      const startDt = new Date(`${bookingDate}T08:00:00`);
      startMs = startDt.getTime();
      endMs = startMs + rentalDays * 24 * 60 * 60 * 1000;
    }

    return showBookingModal.active_bookings.find((b) => {
      const bStart = new Date(b.start_time).getTime();
      const bEnd = new Date(b.end_time).getTime();
      return bStart < endMs && bEnd > startMs;
    });
  };

  // Helper: check if a specific start hour on bookingDate is booked
  const isHourConflict = (hour) => {
    if (!showBookingModal || !showBookingModal.active_bookings || showBookingModal.active_bookings.length === 0) {
      return false;
    }
    const startMs = new Date(`${bookingDate}T${String(hour).padStart(2, '0')}:00:00`).getTime();
    const endMs = startMs + rentalHours * 60 * 60 * 1000;
    return showBookingModal.active_bookings.some((b) => {
      const bStart = new Date(b.start_time).getTime();
      const bEnd = new Date(b.end_time).getTime();
      return bStart < endMs && bEnd > startMs;
    });
  };

  // Handle Create Booking
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!showBookingModal) return;

    const conflict = getConflictingBooking();
    if (conflict) {
      showToast('Selected time slot conflicts with an existing reservation. Please select an available slot.', 'error');
      return;
    }

    try {
      let startIso, endIso;
      if (rentalPlan === 'hourly') {
        const startDt = new Date(`${bookingDate}T${String(bookingStartHour).padStart(2, '0')}:00:00`);
        const endDt = new Date(startDt.getTime() + rentalHours * 60 * 60 * 1000);
        startIso = startDt.toISOString();
        endIso = endDt.toISOString();
      } else {
        const startDt = new Date(`${bookingDate}T08:00:00`);
        const endDt = new Date(startDt.getTime() + rentalDays * 24 * 60 * 60 * 1000);
        startIso = startDt.toISOString();
        endIso = endDt.toISOString();
      }

      const activeFarmerId = (userId && Number(userId) <= 4 && Number(userId) >= 1) ? Number(userId) : 1;
      await fairqueueApi.createBooking(showBookingModal.id, {
        farmer_id: activeFarmerId,
        start_time: startIso,
        end_time: endIso,
      });

      showToast('Machinery slot reserved successfully on FairQueue!', 'success');
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
            <h2 className="view-title">{t('machineryHeading')}</h2>
            <p className="view-desc">
              {t('machinerySub')}
            </p>
          </div>
        </div>

        <div className="view-actions">
          <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            <span>{t('listMachinery')}</span>
          </button>
          <button type="button" className="btn btn-outline" onClick={fetchMachinery} title={language === 'hi' ? 'ताज़ा करें' : 'Refresh'}>
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
            placeholder={language === 'hi' ? 'यंत्र प्रकार खोजें (उदा. ट्रैक्टर)...' : 'Filter equipment type (e.g. tractor)...'}
            value={filters.equipment_type}
            onChange={(e) => setFilters({ ...filters, equipment_type: e.target.value })}
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
            value={filters.is_available}
            onChange={(e) => setFilters({ ...filters, is_available: e.target.value })}
          >
            <option value="all">{language === 'hi' ? 'सभी उपलब्धता' : 'All Availability'}</option>
            <option value="true">{language === 'hi' ? 'अभी उपलब्ध' : 'Available Now (Not In Use)'}</option>
            <option value="false">{language === 'hi' ? 'वर्तमान में आरक्षित' : 'Currently Reserved'}</option>
          </select>
        </div>

        <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={16} className="filter-icon" />
          <input
            type="date"
            className="filter-input"
            value={slotDateFilter}
            onChange={(e) => setSlotDateFilter(e.target.value)}
            title={language === 'hi' ? 'आरक्षित उपकरणों को हटाने के लिए दिनांक चुनें' : 'Filter by reservation date to remove booked equipment'}
          />
        </div>

        {slotDateFilter && (
          <div className="filter-group select-group">
            <select
              className="filter-select"
              value={slotTimeFilter}
              onChange={(e) => setSlotTimeFilter(e.target.value)}
            >
              <option value="all">{language === 'hi' ? 'पूरा दिन (06:00 - 20:00)' : 'Full Day (06:00 - 20:00)'}</option>
              <option value="morning">{language === 'hi' ? 'सुबह (08:00 - 12:00)' : 'Morning (08:00 - 12:00)'}</option>
              <option value="afternoon">{language === 'hi' ? 'दोपहर (13:00 - 17:00)' : 'Afternoon (13:00 - 17:00)'}</option>
            </select>
          </div>
        )}

        {slotDateFilter && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.78rem', padding: '4px 8px' }}
            onClick={() => {
              setSlotDateFilter('');
              setSlotTimeFilter('all');
            }}
          >
            {language === 'hi' ? 'दिनांक हटाएं' : 'Clear Date'}
          </button>
        )}
      </div>

      {/* Machinery Content Grid */}
      <div className="content-card">
        <div className="card-header-bar">
          <h3>
            {language === 'hi' ? `पंजीकृत कृषि यंत्र (${totalCount})` : `Registered Equipment (${totalCount})`}
            {slotDateFilter && (
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#047857', marginLeft: '0.5rem' }}>
                • {language === 'hi' ? `${slotDateFilter} हेतु फ़िल्टर` : `Filtering for ${slotDateFilter}`} ({slotTimeFilter === 'all' ? (language === 'hi' ? 'पूरा दिन' : 'Full Day') : slotTimeFilter})
              </span>
            )}
          </h3>
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
            <p>
              {slotDateFilter
                ? 'All machinery is booked or unavailable for this selected time window. Try another date!'
                : 'Add a tractor or combine harvester to enable booking slots.'}
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> List First Machinery
            </button>
          </div>
        ) : (
          <div className="listings-grid">
            {machineryList.map((m) => {
              const isReservedNow = m.is_currently_reserved;
              const hasBookings = m.active_bookings && m.active_bookings.length > 0;

              return (
                <div
                  key={m.id}
                  className="machinery-card"
                  style={isReservedNow ? { borderColor: '#fed7aa', backgroundColor: '#fffdfa' } : {}}
                >
                  <div className="harvest-card-top">
                    <span
                      className={`status-badge ${
                        isReservedNow ? 'badge-danger' : m.is_available ? 'badge-success' : 'badge-neutral'
                      }`}
                    >
                      {isReservedNow
                        ? (language === 'hi' ? 'अभी उपयोग में' : 'IN USE NOW')
                        : m.is_available
                        ? (language === 'hi' ? 'उपलब्ध' : 'AVAILABLE')
                        : (language === 'hi' ? 'आरक्षित' : 'RESERVED')}
                    </span>
                    <span className="equipment-type-tag">{m.equipment_type.toUpperCase()}</span>
                  </div>

                  <h4 className="machinery-name">{m.name}</h4>

                  {/* Reservation Notice Strip */}
                  {isReservedNow ? (
                    <div
                      style={{
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '0.78rem',
                        color: '#9a3412',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock size={13} />
                      <span>
                        <strong>{language === 'hi' ? 'उपयोग में:' : 'In Use:'}</strong>{' '}
                        {language === 'hi'
                          ? `${m.next_available_at ? new Date(m.next_available_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'आज'} तक आरक्षित`
                          : `Reserved until ${m.next_available_at ? new Date(m.next_available_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'today'}`}
                      </span>
                    </div>
                  ) : hasBookings ? (
                    <div
                      style={{
                        background: '#fefce8',
                        border: '1px solid #fef08a',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '0.78rem',
                        color: '#854d0e',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CalendarCheck size={13} />
                      <span>
                        <strong>{language === 'hi' ? 'आरक्षित स्लॉट:' : 'Reserved Slots:'}</strong>{' '}
                        {language === 'hi'
                          ? `${m.active_bookings.length} आगामी बुकिंग सुरक्षित`
                          : `${m.active_bookings.length} upcoming booking(s) locked`}
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '0.78rem',
                        color: '#166534',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle size={13} />
                      <span>
                        {language === 'hi' ? 'कोई विवाद नहीं • स्लॉट बुकिंग हेतु उपलब्ध' : 'No conflict • Free for slot booking'}
                      </span>
                    </div>
                  )}

                  <div className="machinery-rates-box">
                    <div className="rate-item">
                      <span className="rate-label">{t('hourlyRate')}</span>
                      <strong className="rate-value">
                        {m.hourly_rate ? `₹${Number(m.hourly_rate).toFixed(2)}/${language === 'hi' ? 'घंटा' : 'hr'}` : '—'}
                      </strong>
                    </div>
                    <div className="rate-divider" />
                    <div className="rate-item">
                      <span className="rate-label">{t('dailyRate')}</span>
                      <strong className="rate-value">
                        {m.daily_rate ? `₹${Number(m.daily_rate).toFixed(2)}/${language === 'hi' ? 'दिन' : 'day'}` : '—'}
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
                      <span>
                        {language === 'hi' ? `समय-सारणी (${m.active_bookings?.length || 0})` : `View Schedule (${m.active_bookings?.length || 0})`}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={!m.is_available && !hasBookings}
                      onClick={() => setShowBookingModal(m)}
                      style={isReservedNow ? { background: '#f97316', borderColor: '#f97316' } : {}}
                    >
                      <Clock size={14} />
                      <span>
                        {language === 'hi'
                          ? (isReservedNow ? 'आगामी स्लॉट बुक करें' : 'स्लॉट बुक करें')
                          : (isReservedNow ? 'Book Future Slot' : 'Book Slot')}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE MACHINERY MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <div className="modal-header">
              <h3>{language === 'hi' ? 'नया कृषि यंत्र सूचीबद्ध करें' : 'List New Farm Machinery'}</h3>
              <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateMachinery}>
              <div className="modal-body">
                <div className="modal-helper-row">
                  <span className="helper-text">
                    {language === 'hi' ? 'सूचीबद्धकर्ता: ' : 'Listing as: '}
                    {userProfile?.name || (language === 'hi' ? 'पंजीकृत किसान' : 'Registered Farm Owner')}
                  </span>
                  <button type="button" className="btn-link" onClick={fillSampleTractor}>
                    {language === 'hi' ? 'ट्रैक्टर का नमूना भरें' : 'Fill Sample Tractor'}
                  </button>
                </div>

                <div className="form-group">
                  <label>{language === 'hi' ? 'उपकरण का प्रकार' : 'Equipment Type'}</label>
                  <select
                    value={machineryForm.equipment_type}
                    onChange={(e) => setMachineryForm({ ...machineryForm, equipment_type: e.target.value })}
                  >
                    <option value="tractor">{language === 'hi' ? 'ट्रैक्टर (Tractor)' : 'Tractor'}</option>
                    <option value="combine_harvester">{language === 'hi' ? 'कंबाइन हार्वेस्टर (Combine Harvester)' : 'Combine Harvester'}</option>
                    <option value="rotavator">{language === 'hi' ? 'रोटावेटर (Rotavator)' : 'Rotavator'}</option>
                    <option value="seed_drill">{language === 'hi' ? 'हैप्पी सीडर / सीड ड्रिल (Seed Drill)' : 'Happy Seeder / Seed Drill'}</option>
                    <option value="power_tiller">{language === 'hi' ? 'पावर टिलर (Power Tiller)' : 'Power Tiller'}</option>
                    <option value="laser_leveler">{language === 'hi' ? 'लेज़र लैंड लेवलर (Laser Land Leveler)' : 'Laser Land Leveler'}</option>
                    <option value="sprayer">{language === 'hi' ? 'बूम / ड्रोन स्प्रेयर (Sprayer)' : 'Boom / Drone Sprayer'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{language === 'hi' ? 'मशीन का नाम / मॉडल' : 'Machine Name / Model'}</label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'hi' ? 'उदा. स्वराज 744 FE / महिंद्रा 575' : 'e.g. Swaraj 744 FE'}
                    value={machineryForm.name}
                    onChange={(e) => setMachineryForm({ ...machineryForm, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{language === 'hi' ? 'प्रति घंटा दर (₹)' : 'Hourly Rate (₹)'}</label>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={machineryForm.hourly_rate}
                      onChange={(e) => setMachineryForm({ ...machineryForm, hourly_rate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>{language === 'hi' ? 'दैनिक दर (₹)' : 'Daily Rate (₹)'}</label>
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
                    <label>{language === 'hi' ? 'राज्य' : 'State'}</label>
                    <input
                      type="text"
                      required
                      value={machineryForm.state}
                      onChange={(e) => setMachineryForm({ ...machineryForm, state: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>{language === 'hi' ? 'ज़िला' : 'District'}</label>
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
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary">
                  {language === 'hi' ? 'मशीनरी सूचीबद्ध करें' : 'Publish Implement'}
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
              <div>
                <h3 style={{ margin: 0 }}>
                  {language === 'hi' ? `आरक्षित करें: ${showBookingModal.name}` : `Book ${showBookingModal.name}`}
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {showBookingModal.district}, {showBookingModal.state} • {language === 'hi' ? 'मशीन #' : 'Machine #'}{showBookingModal.id}
                </span>
              </div>
              <button type="button" className="btn-close" onClick={() => setShowBookingModal(null)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateBooking}>
              <div className="modal-body">
                {/* Auto-Verified Farmer Details (No manual ID input) */}
                <div className="booking-farmer-info-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                    {language === 'hi' ? 'आरक्षण आवंटन विवरण' : 'RESERVATION ALLOTMENT'}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#14532d' }}>
                    {userProfile?.name || (language === 'hi' ? 'सरदार बलविंदर सिंह' : 'Sardar Balvinder Singh')} ({language === 'hi' ? 'किसान सदस्य' : 'Kisan Member'})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '2px' }}>
                    {language === 'hi'
                      ? 'त्वरित फेयर-क्यू स्लॉट लॉक • शून्य बिचौलिया कमीशन'
                      : 'Instant fair-queue slot lock • Zero middleman commission'}
                  </div>
                </div>

                {/* Existing Bookings Schedule on this machine */}
                {showBookingModal.active_bookings && showBookingModal.active_bookings.length > 0 && (
                  <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#854d0e', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarCheck size={14} /> {language === 'hi' ? 'इस मशीन पर पूर्व आरक्षित स्लॉट:' : 'Existing Reserved Slots on this Machine:'}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#713f12', lineHeight: '1.5' }}>
                      {showBookingModal.active_bookings.map((b) => (
                        <li key={b.id}>
                          <strong>{new Date(b.start_time).toLocaleDateString()}:</strong>{' '}
                          {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                          {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                          <span style={{ fontSize: '0.72rem', background: '#fde047', padding: '1px 5px', borderRadius: '4px', textTransform: 'capitalize' }}>
                            {b.status === 'confirmed' ? (language === 'hi' ? 'पुष्ट' : 'confirmed') : b.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rental Plan Selector: Hourly vs Daily */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 650, fontSize: '0.88rem', color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                    {language === 'hi' ? 'किराया मूल्य मॉडल चुनें:' : 'Choose Rental Pricing Model:'}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                      type="button"
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: rentalPlan === 'hourly' ? '2px solid #059669' : '1px solid #cbd5e1',
                        background: rentalPlan === 'hourly' ? '#ecfdf5' : '#ffffff',
                        color: rentalPlan === 'hourly' ? '#065f46' : '#334155',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                      onClick={() => setRentalPlan('hourly')}
                    >
                      <div style={{ fontSize: '0.95rem' }}>{language === 'hi' ? '⏱️ प्रति घंटा किराया' : '⏱️ Hourly Rental'}</div>
                      <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                        ₹{Number(showBookingModal.hourly_rate || 0)} {language === 'hi' ? '/ घंटा' : '/ Hour'}
                      </div>
                    </button>

                    <button
                      type="button"
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: rentalPlan === 'daily' ? '2px solid #059669' : '1px solid #cbd5e1',
                        background: rentalPlan === 'daily' ? '#ecfdf5' : '#ffffff',
                        color: rentalPlan === 'daily' ? '#065f46' : '#334155',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                      onClick={() => setRentalPlan('daily')}
                    >
                      <div style={{ fontSize: '0.95rem' }}>{language === 'hi' ? 'दैनिक किराया' : 'Daily Rental'}</div>
                      <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                        ₹{Number(showBookingModal.daily_rate || 0)} {language === 'hi' ? '/ दिन' : '/ Day'}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Booking Date */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 650, fontSize: '0.88rem', color: '#1e293b' }}>
                    {language === 'hi' ? 'आरक्षण दिनांक:' : 'Reservation Date:'}
                  </label>
                  <input
                    type="date"
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>

                {/* If Hourly: Slot Time & Hours */}
                {rentalPlan === 'hourly' && (
                  <>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label style={{ fontWeight: 650, fontSize: '0.88rem', color: '#1e293b' }}>
                        {language === 'hi' ? 'शुरुआती समय विंडो:' : 'Start Time Window:'}
                      </label>
                      <select
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                        value={bookingStartHour}
                        onChange={(e) => setBookingStartHour(Number(e.target.value))}
                      >
                        {[
                          { h: 6, labelEn: '06:00 AM (Early Morning Slot)', labelHi: 'प्रातः 06:00 (सुबह का स्लॉट)' },
                          { h: 8, labelEn: '08:00 AM (Morning Slot)', labelHi: 'सुबह 08:00 (सामान्य स्लॉट)' },
                          { h: 10, labelEn: '10:00 AM (Mid-Morning Slot)', labelHi: 'सुबह 10:00 (मध्य-सुबह स्लॉट)' },
                          { h: 13, labelEn: '01:00 PM (Afternoon Slot)', labelHi: 'दोपहर 01:00 (दोपहर स्लॉट)' },
                          { h: 15, labelEn: '03:00 PM (Late Afternoon Slot)', labelHi: 'अपराह्न 03:00 (शाम स्लॉट)' },
                        ].map(({ h, labelEn, labelHi }) => {
                          const isTaken = isHourConflict(h);
                          const label = language === 'hi' ? labelHi : labelEn;
                          return (
                            <option key={h} value={h} disabled={isTaken}>
                              {label} {isTaken ? (language === 'hi' ? '— ❌ पहले से बुक है' : '— ❌ ALREADY BOOKED') : (language === 'hi' ? '— ✅ उपलब्ध' : '— ✅ Free')}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label style={{ fontWeight: 650, fontSize: '0.88rem', color: '#1e293b' }}>
                        {language === 'hi' ? 'आवश्यक अवधि (घंटे):' : 'Duration (Hours):'}
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                        {[2, 4, 6, 8].map((h) => (
                          <button
                            key={h}
                            type="button"
                            style={{
                              flex: 1,
                              padding: '8px',
                              borderRadius: '6px',
                              border: rentalHours === h ? '2px solid #059669' : '1px solid #cbd5e1',
                              background: rentalHours === h ? '#ecfdf5' : '#ffffff',
                              color: rentalHours === h ? '#065f46' : '#334155',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            onClick={() => setRentalHours(h)}
                          >
                            {h} {language === 'hi' ? 'घंटे' : 'Hours'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* If Daily: Days Count */}
                {rentalPlan === 'daily' && (
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: 650, fontSize: '0.88rem', color: '#1e293b' }}>
                      {language === 'hi' ? 'आवश्यक दिनों की संख्या:' : 'Number of Days Needed:'}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                      {[1, 2, 3, 5].map((d) => (
                        <button
                          key={d}
                          type="button"
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '6px',
                            border: rentalDays === d ? '2px solid #059669' : '1px solid #cbd5e1',
                            background: rentalDays === d ? '#ecfdf5' : '#ffffff',
                            color: rentalDays === d ? '#065f46' : '#334155',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          onClick={() => setRentalDays(d)}
                        >
                          {d} {d === 1 ? (language === 'hi' ? 'दिन' : 'Day') : (language === 'hi' ? 'दिन' : 'Days')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conflict Alert or Availability Confirmation */}
                {(() => {
                  const conflict = getConflictingBooking();
                  if (conflict) {
                    return (
                      <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#991b1b', fontWeight: 700, fontSize: '0.88rem' }}>
                          <XCircle size={17} />
                          <span>{language === 'hi' ? 'स्लॉट पहले से आरक्षित है' : 'Slot Already Reserved'}</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#b91c1c', marginTop: '3px', lineHeight: '1.4' }}>
                          {language === 'hi'
                            ? `यह मशीन ${new Date(conflict.start_time).toLocaleDateString()} को ${new Date(conflict.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} से ${new Date(conflict.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} तक पहले से आरक्षित है। कृपया अन्य समय चुनें।`
                            : `This equipment is already locked from ${new Date(conflict.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(conflict.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on ${new Date(conflict.start_time).toLocaleDateString()}. Please select another start time window or date.`}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.65rem 0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontSize: '0.82rem', fontWeight: 600 }}>
                      <CheckCircle size={15} />
                      <span>{language === 'hi' ? 'यह समय स्लॉट पूरी तरह उपलब्ध है! शून्य ओवरलैप।' : 'This time slot is completely available! Zero overlap detected.'}</span>
                    </div>
                  );
                })()}

                {/* Estimated Rental Cost Preview */}
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', color: '#475569' }}>
                      {language === 'hi' ? 'आवंटन:' : 'Allotment:'}{' '}
                      <strong>{rentalPlan === 'hourly' ? `${rentalHours} ${language === 'hi' ? 'घंटे' : 'Hours'}` : `${rentalDays} ${language === 'hi' ? 'दिन' : 'Days'}`}</strong>
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#166534' }}>
                      {language === 'hi' ? 'कुल:' : 'Total:'} ₹{rentalPlan === 'hourly'
                        ? (rentalHours * Number(showBookingModal.hourly_rate || 0)).toLocaleString('en-IN')
                        : (rentalDays * Number(showBookingModal.daily_rate || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                    {language === 'hi' ? 'गणना:' : 'Calculation:'} {rentalPlan === 'hourly'
                      ? `${rentalHours} hrs × ₹${Number(showBookingModal.hourly_rate || 0)}/hr`
                      : `${rentalDays} days × ₹${Number(showBookingModal.daily_rate || 0)}/day`}
                  </div>
                </div>

                <p className="subtext-note" style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  {language === 'hi'
                    ? 'फेयर-क्यू स्वचालित रूप से स्लॉट उपलब्धता की पुष्टि करता है और ओवरलैपिंग से सुरक्षित रखता है।'
                    : 'FairQueue automatically verifies slot availability and locks equipment against double-booking.'}
                </p>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookingModal(null)}>
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                {(() => {
                  const conflict = getConflictingBooking();
                  return (
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!!conflict}
                      style={{
                        background: conflict ? '#94a3b8' : '#059669',
                        borderColor: conflict ? '#94a3b8' : '#059669',
                        cursor: conflict ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {conflict
                        ? (language === 'hi' ? 'स्लॉट आरक्षित है — अन्य समय चुनें' : 'Slot Reserved — Pick Another Time')
                        : (language === 'hi' ? 'मशीनरी आवंटन की पुष्टि करें' : 'Confirm Machinery Allotment')}
                    </button>
                  );
                })()}
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
                <h3>
                  {language === 'hi' ? `बुकिंग समय-सारणी: ${showBookingsListModal.name}` : `Booking Schedule: ${showBookingsListModal.name}`}
                </h3>
                <span className="text-muted">
                  {language === 'hi' ? 'मशीन आईडी #' : 'Machine ID #'}{showBookingsListModal.id}
                </span>
              </div>
              <button type="button" className="btn-close" onClick={() => setShowBookingsListModal(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {loadingBookings ? (
                <div className="loading-state">
                  <RefreshCw size={24} className="spin" />
                  <p>{language === 'hi' ? 'समय-सारणी लोड हो रही है...' : 'Loading schedule...'}</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={40} className="empty-icon" />
                  <h4>{language === 'hi' ? 'अभी कोई बुकिंग नहीं' : 'No bookings yet'}</h4>
                  <p>{language === 'hi' ? 'यह मशीन पूरी तरह उपलब्ध है, कोई आरक्षण निर्धारित नहीं है।' : 'This equipment is completely free with no scheduled reservations.'}</p>
                </div>
              ) : (
                <div className="comparison-table-wrapper">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>{language === 'hi' ? 'बुकिंग आईडी' : 'Booking ID'}</th>
                        <th>{language === 'hi' ? 'किसान' : 'Farmer'}</th>
                        <th>{language === 'hi' ? 'प्रारंभ समय' : 'Start Time'}</th>
                        <th>{language === 'hi' ? 'समाप्ति समय' : 'End Time'}</th>
                        <th>{language === 'hi' ? 'कुल किराया' : 'Total Cost'}</th>
                        <th>{language === 'hi' ? 'स्थिति' : 'Status'}</th>
                        <th>{language === 'hi' ? 'कार्रवाई' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id}>
                          <td>#{b.id}</td>
                          <td>{language === 'hi' ? `किसान #${b.farmer_id}` : `Farmer #${b.farmer_id}`}</td>
                          <td>{new Date(b.start_time).toLocaleString()}</td>
                          <td>{new Date(b.end_time).toLocaleString()}</td>
                          <td>₹{Number(b.total_cost || 0).toLocaleString()}</td>
                          <td>
                            <span className={`status-pill-sm ${b.status}`}>
                              {b.status === 'confirmed' ? (language === 'hi' ? 'पुष्ट' : 'confirmed') : b.status === 'pending' ? (language === 'hi' ? 'लंबित' : 'pending') : b.status === 'completed' ? (language === 'hi' ? 'पूर्ण' : 'completed') : b.status}
                            </span>
                          </td>
                          <td>
                            {b.status === 'pending' && (
                              <div className="action-buttons-inline">
                                <button
                                  type="button"
                                  className="btn-icon-action btn-accept"
                                  onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                                  title={language === 'hi' ? 'बुकिंग की पुष्टि करें' : 'Confirm booking'}
                                >
                                  <CheckCircle size={15} /> {language === 'hi' ? 'पुष्टि करें' : 'Confirm'}
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon-action btn-reject"
                                  onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                  title={language === 'hi' ? 'बुकिंग रद्द करें' : 'Cancel booking'}
                                >
                                  <XCircle size={15} /> {language === 'hi' ? 'रद्द' : 'Cancel'}
                                </button>
                              </div>
                            )}
                            {b.status === 'confirmed' && (
                              <div className="action-buttons-inline">
                                <button
                                  type="button"
                                  className="btn-icon-action btn-accept"
                                  onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                                  title={language === 'hi' ? 'पूर्ण चिन्हित करें' : 'Mark as completed'}
                                >
                                  <CheckCircle size={15} /> {language === 'hi' ? 'पूर्ण करें' : 'Complete'}
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon-action btn-reject"
                                  onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                  title={language === 'hi' ? 'बुकिंग रद्द करें' : 'Cancel booking'}
                                >
                                  <XCircle size={15} /> {language === 'hi' ? 'रद्द' : 'Cancel'}
                                </button>
                              </div>
                            )}
                            {(b.status === 'completed' || b.status === 'cancelled') && (
                              <span className="decision-label">
                                {b.status === 'completed' ? (language === 'hi' ? 'पूर्ण' : 'completed') : (language === 'hi' ? 'रद्द' : 'cancelled')}
                              </span>
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
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
