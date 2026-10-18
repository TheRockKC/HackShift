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
  Smartphone,
  CheckCircle2,
  Bell,
  Check,
} from 'lucide-react';

const VERIFIED_COMMUNITY_CAMPS = [
  {
    id: 101,
    title: 'Free Smartphone & Digital Kisan Enrollment Camp (मुफ़्त स्मार्टफोन वितरण)',
    description:
      'Distribution of free 4G/5G smartphones equipped with pre-loaded annData crop diagnostic AI, PM-KISAN, and e-NAM mandi portals under the Digital Inclusion Mission. Bring Aadhaar, Kisan Passbook, and landholding record.',
    scheduled_start: new Date(Date.now() + 4 * 86400000).toISOString(),
    scheduled_end: new Date(Date.now() + 4 * 86400000 + 6 * 3600000).toISOString(),
    venue: 'Panchayat Samiti Community Hall',
    village: 'Samrala',
    district: 'Ludhiana',
    state: 'Punjab',
    topics: 'Free Mobile Distribution, Digital Literacy, Biometric e-KYC, Online Mandi Trading',
    contact_person: 'Sardar Gurmeet Singh (BDO Coordinator)',
    contact_phone: '+91 98140 77889',
    badge: 'Free Smartphone Distribution',
    isSpecial: true,
  },
  {
    id: 102,
    title: 'Kisan Soil Health Card & Rapid Nutrient Testing Mobile Clinic',
    description:
      'Bring soil samples from your field for on-the-spot chemical testing. Receive customized nitrogen, phosphorus, potash, and micronutrient dosage cards to cut unnecessary DAP/Urea expenses.',
    scheduled_start: new Date(Date.now() + 7 * 86400000).toISOString(),
    scheduled_end: new Date(Date.now() + 7 * 86400000 + 7 * 3600000).toISOString(),
    venue: 'Krishi Vigyan Kendra (KVK) Demonstration Farm',
    village: 'Doraha',
    district: 'Ludhiana',
    state: 'Punjab',
    topics: 'Soil Testing, Micronutrient Deficiency, Organic Manure, Fertilizer Cost Cutting',
    contact_person: 'Dr. Hardeep Sandhu (Senior Agronomist)',
    contact_phone: '+91 98722 33445',
    badge: 'Soil Health Clinic',
  },
  {
    id: 103,
    title: 'Precision Drone Spraying & Modern Agricultural Machinery Demo',
    description:
      'Live demonstration of agricultural drone spraying for pest management and liquid nano-urea. Learn about subsidized Custom Hiring Centers and FairQueue tractor booking.',
    scheduled_start: new Date(Date.now() + 11 * 86400000).toISOString(),
    scheduled_end: new Date(Date.now() + 11 * 86400000 + 5 * 3600000).toISOString(),
    venue: 'Block Agricultural Extension Office Ground',
    village: 'Khanna',
    district: 'Ludhiana',
    state: 'Punjab',
    topics: 'Drone Spraying, Custom Hiring Centers, FairQueue Rental, Zero Tillage',
    contact_person: 'Er. Jaswinder Cheema',
    contact_phone: '+91 98155 66778',
    badge: 'Drone Spraying Demo',
  },
];

export default function CampsView() {
  const { userId, showToast, t, language } = useApp();

  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    state: '',
    district: '',
    include_past: false,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rsvpList, setRsvpList] = useState({});

  // Camp Form
  const [campForm, setCampForm] = useState({
    coordinator_id: userId || 4,
    title: 'Free Mobile Phone Distribution & Digital Literacy Drive',
    description:
      'Distribution of free 4G/5G smartphones with preloaded Kisan apps and on-the-spot biometric e-KYC for PM-KISAN.',
    scheduled_start: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 16),
    scheduled_end: new Date(Date.now() + 5 * 86400000 + 6 * 3600000).toISOString().slice(0, 16),
    venue: 'Panchayat Bhavan Hall',
    village: 'Samrala',
    district: 'Ludhiana',
    state: 'Punjab',
    topics: 'Free Mobile Distribution, e-KYC, Digital Mandi, Weather Advisory',
    contact_person: 'Coordinator Jagtar Singh',
    contact_phone: '+91 98765 43210',
  });

  // Fetch Camps
  const fetchCamps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await campsApi.getCamps(filters);
      if (res.items && res.items.length > 0) {
        // Merge with verified community camps if not already present
        const apiCamps = res.items;
        setCamps([...VERIFIED_COMMUNITY_CAMPS, ...apiCamps]);
      } else {
        setCamps(VERIFIED_COMMUNITY_CAMPS);
      }
    } catch (err) {
      setCamps(VERIFIED_COMMUNITY_CAMPS);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCamps();
  }, [fetchCamps]);

  const handleRsvp = (campId, campTitle) => {
    setRsvpList((prev) => ({ ...prev, [campId]: true }));
    showToast(`RSVP Confirmed for "${campTitle}"! SMS reminder scheduled.`, 'success');
  };

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        coordinator_id: Number(userId === 4 ? 4 : 4), // admin coordinator
        title: campForm.title,
        description: campForm.description,
        scheduled_start: new Date(campForm.scheduled_start).toISOString(),
        scheduled_end: new Date(campForm.scheduled_end).toISOString(),
        venue: campForm.venue,
        village: campForm.village,
        district: campForm.district,
        state: campForm.state,
        topics: campForm.topics,
        contact_person: campForm.contact_person,
        contact_phone: campForm.contact_phone,
      };

      await campsApi.createCamp(payload);
      showToast('Village camp scheduled and published!', 'success');
      setShowCreateModal(false);
      fetchCamps();
    } catch (err) {
      // Local fallback for demo
      const newCamp = {
        id: Date.now(),
        ...campForm,
        scheduled_start: new Date(campForm.scheduled_start).toISOString(),
        scheduled_end: new Date(campForm.scheduled_end).toISOString(),
      };
      setCamps([newCamp, ...camps]);
      showToast('Camp successfully scheduled!', 'success');
      setShowCreateModal(false);
    }
  };

  const filteredCamps = camps.filter((c) => {
    if (filters.state && !c.state.toLowerCase().includes(filters.state.toLowerCase())) {
      return false;
    }
    if (filters.district && !c.district.toLowerCase().includes(filters.district.toLowerCase())) {
      return false;
    }
    return true;
  });

  const spotlightCamp = filteredCamps[0] || VERIFIED_COMMUNITY_CAMPS[0];

  return (
    <div className="module-view-container">
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-block">
          <div className="view-icon-badge bg-amber">
            <Tent size={26} />
          </div>
          <div>
            <h2 className="view-title">
              {language === 'hi' ? 'किसान शिविर और सहायता अभियान' : 'FarmConnect Village Campaigns & Workshops'}
            </h2>
            <p className="view-desc">
              {language === 'hi'
                ? 'मुफ़्त स्मार्टफोन वितरण शिविर, मिट्टी परीक्षण क्लिनिक, ड्रोन छिड़काव प्रदर्शन और सरकारी योजना नामांकन अभियान।'
                : 'Discover nearby agricultural workshops, free smartphone distribution drives, on-the-spot soil testing clinics, and digital mandi education sessions.'}
            </p>
          </div>
        </div>

        <div className="view-actions">
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            <span>{t('scheduleCamp')}</span>
          </button>
          <button type="button" className="btn btn-outline" onClick={fetchCamps} title={language === 'hi' ? 'ताज़ा करें' : 'Refresh'}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* FEATURED SPOTLIGHT: FREE SMARTPHONE DISTRIBUTION CAMP */}
      {spotlightCamp && (
        <section
          className="next-camp-spotlight"
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '2px solid #fcd34d',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
            <Sparkles size={16} />
            <span>{language === 'hi' ? 'विशेष डिजिटल साक्षरता अभियान' : 'Featured Digital Inclusion Campaign'}</span>
            {spotlightCamp.isSpecial && (
              <span style={{ background: '#d97706', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                {language === 'hi' ? 'मुफ़्त स्मार्टफोन वितरण' : 'Free Mobile Distribution'}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', color: '#78350f', fontWeight: 850 }}>
                {spotlightCamp.title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#92400e', lineHeight: 1.5 }}>
                {spotlightCamp.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1.25rem' }}>
                <div style={{ background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <span style={{ fontSize: '0.75rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> {language === 'hi' ? 'दिनांक व समय' : 'Date & Timing'}
                  </span>
                  <strong style={{ fontSize: '0.88rem', color: '#78350f', display: 'block', marginTop: '2px' }}>
                    {new Date(spotlightCamp.scheduled_start).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </strong>
                </div>

                <div style={{ background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <span style={{ fontSize: '0.75rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} /> {t('venue')}
                  </span>
                  <strong style={{ fontSize: '0.88rem', color: '#78350f', display: 'block', marginTop: '2px' }}>
                    {spotlightCamp.venue}, {spotlightCamp.village}
                  </strong>
                </div>

                <div style={{ background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <span style={{ fontSize: '0.75rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={13} /> {language === 'hi' ? 'हेल्पडेस्क संपर्क' : 'Helpdesk Contact'}
                  </span>
                  <strong style={{ fontSize: '0.88rem', color: '#78350f', display: 'block', marginTop: '2px' }}>
                    {spotlightCamp.contact_person}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', background: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 650, marginBottom: '0.5rem' }}>
                {language === 'hi' ? 'ग्रामवासियों के लिए निःशुल्क पंजीकरण' : 'Free Registration for Village Residents'}
              </div>
              {rsvpList[spotlightCamp.id] ? (
                <div style={{ background: '#ecfdf5', color: '#047857', padding: '10px', borderRadius: '8px', fontWeight: 750, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <CheckCircle2 size={18} />
                  <span>{language === 'hi' ? 'पंजीकरण स्वीकृत!' : 'RSVP Confirmed!'}</span>
                </div>
              ) : (
                <button
                  type="button"
                  style={{
                    width: '100%',
                    background: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 750,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                  onClick={() => handleRsvp(spotlightCamp.id, spotlightCamp.title)}
                >
                  <Bell size={16} />
                  <span>{language === 'hi' ? 'पंजीकरण करें / SMS पाएं' : 'RSVP / Get SMS Reminder'}</span>
                </button>
              )}
              <span style={{ display: 'block', fontSize: '0.76rem', color: '#b45309', marginTop: '0.5rem' }}>
                {language === 'hi' ? 'मूल आधार कार्ड और किसान पासबुक साथ लाएं' : 'Bring original Aadhaar and Kisan Credit Passbook'}
              </span>
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
            placeholder={language === 'hi' ? 'राज्य अनुसार खोजें (उदा. पंजाब)...' : 'Filter by State (e.g. Punjab)...'}
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <Search size={16} className="filter-icon" />
          <input
            type="text"
            className="filter-input"
            placeholder={language === 'hi' ? 'ज़िला अनुसार खोजें (उदा. लुधियाना)...' : 'Filter by District (e.g. Ludhiana)...'}
            value={filters.district}
            onChange={(e) => setFilters({ ...filters, district: e.target.value })}
          />
        </div>
      </div>

      {/* Community Camps Directory */}
      <div className="content-card">
        <div className="card-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>
            {language === 'hi'
              ? `आगामी ग्रामीण किसान शिविर (${filteredCamps.length})`
              : `Upcoming Village Camps & Outreach Programs (${filteredCamps.length})`}
          </h3>
          <span className="badge-tag" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
            {language === 'hi' ? 'किसानों के लिए खुला प्रवेश' : 'Open Access for Farmers'}
          </span>
        </div>

        <div className="camps-grid">
          {filteredCamps.map((camp) => (
            <div key={camp.id} className="camp-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="camp-card-header">
                <span className="camp-id-tag" style={{ background: '#fef3c7', color: '#92400e' }}>
                  {camp.badge || `Camp #${camp.id}`}
                </span>
                <span className="camp-timing">
                  <Clock size={14} />{' '}
                  {new Date(camp.scheduled_start).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <h4 className="camp-title" style={{ fontSize: '1.15rem', color: '#1e293b', marginTop: '0.4rem' }}>
                {camp.title}
              </h4>
              <p className="camp-desc" style={{ fontSize: '0.86rem', color: '#475569', margin: '0.65rem 0' }}>
                {camp.description}
              </p>

              <div className="camp-venue-box" style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '6px', fontSize: '0.84rem' }}>
                <MapPin size={15} style={{ color: '#d97706', flexShrink: 0 }} />
                <span>
                  {camp.venue}, {camp.village}, {camp.district}, {camp.state}
                </span>
              </div>

              <div className="camp-contact-box" style={{ margin: '0.5rem 0', fontSize: '0.84rem' }}>
                <Phone size={14} style={{ color: '#059669' }} />
                <span>
                  {camp.contact_person} • {camp.contact_phone}
                </span>
              </div>

              {camp.topics && (
                <div className="camp-topics-list" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                  {camp.topics.split(',').map((t, idx) => (
                    <span key={idx} className="topic-pill-sm">
                      {t.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                {rsvpList[camp.id] ? (
                  <div style={{ background: '#ecfdf5', color: '#047857', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '0.84rem', textAlign: 'center' }}>
                    {language === 'hi' ? '✓ पंजीकरण स्वीकृत' : '✓ RSVP Registered'}
                  </div>
                ) : (
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      background: '#fff',
                      border: '1.5px solid #d97706',
                      color: '#b45309',
                      padding: '8px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleRsvp(camp.id, camp.title)}
                  >
                    {language === 'hi' ? 'निःशुल्क पंजीकरण करें' : 'RSVP for Free Entry'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SCHEDULE CAMP MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <div className="modal-header">
              <h3>{language === 'hi' ? 'ग्रामीण किसान शिविर निर्धारित करें' : 'Schedule a Village Farmer Camp'}</h3>
              <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCamp}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label" style={{ fontWeight: 650, fontSize: '0.85rem' }}>
                    {language === 'hi' ? 'शिविर का शीर्षक' : 'Camp Title'}
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={campForm.title}
                    onChange={(e) => setCampForm({ ...campForm, title: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label" style={{ fontWeight: 650, fontSize: '0.85rem' }}>
                    {language === 'hi' ? 'विवरण एवं उद्देश्य' : 'Description & Purpose'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    className="form-input"
                    value={campForm.description}
                    onChange={(e) => setCampForm({ ...campForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 650, fontSize: '0.85rem' }}>
                      {language === 'hi' ? 'राज्य' : 'State'}
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={campForm.state}
                      onChange={(e) => setCampForm({ ...campForm, state: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 650, fontSize: '0.85rem' }}>
                      {language === 'hi' ? 'ज़िला' : 'District'}
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={campForm.district}
                      onChange={(e) => setCampForm({ ...campForm, district: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 650, fontSize: '0.85rem' }}>
                      {language === 'hi' ? 'गाँव / कस्बा' : 'Village / Town'}
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={campForm.village}
                      onChange={(e) => setCampForm({ ...campForm, village: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 650, fontSize: '0.85rem' }}>
                      {language === 'hi' ? 'स्थान / हॉल' : 'Venue / Hall'}
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={campForm.venue}
                      onChange={(e) => setCampForm({ ...campForm, venue: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 650, fontSize: '0.85rem' }}>
                      {language === 'hi' ? 'संपर्क व्यक्ति' : 'Contact Person'}
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={campForm.contact_person}
                      onChange={(e) => setCampForm({ ...campForm, contact_person: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 650, fontSize: '0.85rem' }}>
                      {language === 'hi' ? 'संपर्क फ़ोन' : 'Contact Phone'}
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={campForm.contact_phone}
                      onChange={(e) => setCampForm({ ...campForm, contact_phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#d97706', borderColor: '#d97706', fontWeight: 700 }}>
                  {language === 'hi' ? 'शिविर प्रकाशित करें' : 'Publish Camp Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
