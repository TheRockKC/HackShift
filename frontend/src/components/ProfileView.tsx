import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Bell,
  Save,
  CheckCircle2,
  MapPin,
  Sprout,
  Mail,
  Phone,
  Globe,
  X,
  Droplets,
  Layers,
  FileText,
  ScanLine,
  Calendar,
} from 'lucide-react';

interface ProfileViewProps {
  isOpen: boolean;
  onClose: () => void;
  activeSubView?: 'profile' | 'notifications';
  setActiveTab: (tab: string) => void;
}

export default function ProfileView({
  isOpen,
  onClose,
  activeSubView = 'profile',
  setActiveTab,
}: ProfileViewProps) {
  const {
    t,
    userProfile,
    updateUserProfile,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    showToast,
    language,
    setLanguage,
  } = useApp();

  const [currentSubTab, setCurrentSubTab] = useState<'profile' | 'notifications'>(activeSubView);
  const [formData, setFormData] = useState({
    name: userProfile?.name || 'Sardar Balvinder Singh',
    phone: userProfile?.phone || '+91 98765 43210',
    email: userProfile?.email || 'balvinder.kisan@anndata.in',
    state: userProfile?.state || 'Punjab',
    district: userProfile?.district || 'Ludhiana',
    farmLocation: userProfile?.farmLocation || 'Samrala Village, Ludhiana',
    farmSizeAcres: userProfile?.farmSizeAcres || 12.5,
    primaryCrops: userProfile?.primaryCrops || 'Wheat, Rice (Basmati), Tomato',
    soilType: userProfile?.soilType || 'Alluvial Loam',
    irrigationSource: userProfile?.irrigationSource || 'Tubewell (Solar & Grid Powered)',
  });

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(formData);
    showToast(t('profileSavedSuccess'), 'success');
  };

  return (
    <div className="modal-backdrop">
      <div className="profile-modal-card">
        {/* Modal Header */}
        <div className="profile-modal-header">
          <div className="modal-tabs-group">
            <button
              type="button"
              className={`modal-tab-btn ${currentSubTab === 'profile' ? 'active' : ''}`}
              onClick={() => setCurrentSubTab('profile')}
            >
              <User size={18} />
              <span>{t('profile')}</span>
            </button>
            <button
              type="button"
              className={`modal-tab-btn ${currentSubTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setCurrentSubTab('notifications')}
            >
              <Bell size={18} />
              <span>{t('notifications')} ({notifications.filter((n: any) => !n.read).length})</span>
            </button>
          </div>

          <button type="button" className="close-modal-icon-btn" onClick={onClose} aria-label="Close profile">
            <X size={20} />
          </button>
        </div>

        {/* Tab 1: Unified Agricultural Profile */}
        {currentSubTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="profile-form-scrollable">
            <div className="profile-intro-banner" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sprout size={20} style={{ color: '#166534' }} />
                <div>
                  <strong style={{ color: '#14532d', fontSize: '0.95rem' }}>{language === 'hi' ? 'अन्नदाता किसान खाता' : 'annData Kisan Account'}</strong>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#15803d' }}>
                    {language === 'hi'
                      ? 'आपके खेत, मिट्टी और क्षेत्र के विवरण का उपयोग सटीक रोग मॉडल, सिंचाई सारणी और योजना मिलान के लिए किया जाता है।'
                      : 'Your farm, soil, and regional details are used to calibrate smart disease models, tubewell schedules, and scheme matches.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="profile-form-grid">
              {/* Personal Details */}
              <div className="form-group">
                <label className="form-label">{language === 'hi' ? 'पूरा नाम' : 'Full Name'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'hi' ? 'ईमेल पता (वैकल्पिक)' : 'Email Address (Optional)'}</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('filterByState')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('filterByDistrict')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'hi' ? 'गांव / तहसील स्थान' : 'Village / Tehsil Location'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.farmLocation}
                  onChange={(e) => setFormData({ ...formData, farmLocation: e.target.value })}
                />
              </div>

              {/* Agricultural & Field Details */}
              <div className="form-group">
                <label className="form-label">{language === 'hi' ? 'कुल कृषि रकबा (एकड़)' : 'Total Landholding (Acres)'}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="form-input"
                  value={formData.farmSizeAcres}
                  onChange={(e) => setFormData({ ...formData, farmSizeAcres: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('cropsUnderCultivation')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={language === 'hi' ? 'गेहूं, धान, टमाटर, कपास, गन्ना...' : 'Wheat, Rice, Tomato, Cotton, Sugarcane...'}
                  value={formData.primaryCrops}
                  onChange={(e) => setFormData({ ...formData, primaryCrops: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('soilType')}</label>
                <select
                  className="form-input"
                  value={formData.soilType}
                  onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                >
                  <option value="Alluvial Loam">{language === 'hi' ? 'जलोढ़ दोमट (Alluvial Loam)' : 'Alluvial Loam (Balanced)'}</option>
                  <option value="Sandy Loam">{language === 'hi' ? 'बलुई दोमट (Sandy Loam)' : 'Sandy Loam (Quick draining)'}</option>
                  <option value="Clay Loam">{language === 'hi' ? 'चिकनी दोमट (Clay Loam)' : 'Clay Loam (High water retention)'}</option>
                  <option value="Black Cotton Soil">{language === 'hi' ? 'काली कपास मिट्टी (Black Soil)' : 'Black Cotton Soil (Heavy clay)'}</option>
                  <option value="Red Soil">{language === 'hi' ? 'लाल / लैटेराइट मिट्टी' : 'Red / Laterite Soil'}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'hi' ? 'मुख्य सिंचाई स्रोत' : 'Primary Irrigation Source'}</label>
                <select
                  className="form-input"
                  value={formData.irrigationSource}
                  onChange={(e) => setFormData({ ...formData, irrigationSource: e.target.value })}
                >
                  <option value="Tubewell (Solar & Grid Powered)">{language === 'hi' ? 'ट्यूबवेल / सबमर्सिबल पंप (सौर व ग्रिड)' : 'Tubewell (Electric / Solar Pump)'}</option>
                  <option value="Canal Irrigation">{language === 'hi' ? 'नहरी सिंचाई (नहर / रजबहा)' : 'Canal Irrigation (Nehar / Rajbaha)'}</option>
                  <option value="Drip / Micro-Sprinkler">{language === 'hi' ? 'ड्रिप / माइक्रो-स्प्रिंकलर प्रणाली' : 'Drip / Micro-Sprinkler System'}</option>
                  <option value="Rainfed (Barani)">{language === 'hi' ? 'वर्षा आधारित (बारानी)' : 'Rainfed (Dependent on monsoon)'}</option>
                </select>
              </div>
            </div>

            <div className="modal-footer-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                {t('cancel')}
              </button>
              <button type="submit" className="save-btn">
                <Save size={16} />
                <span>{t('saveProfile')}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Notification Center */}
        {currentSubTab === 'notifications' && (
          <div className="notifications-list-pane">
            <div className="notifs-header-strip">
              <span>{language === 'hi' ? `कुल ${notifications.length} सूचनाएं` : `${notifications.length} Total Alerts`}</span>
              <button type="button" className="mark-all-read-btn" onClick={markAllNotificationsRead}>
                {t('markAllRead')}
              </button>
            </div>

            <div className="notifs-items-scroll">
              {notifications.length > 0 ? (
                notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`notif-card-row ${n.read ? 'is-read' : 'is-unread'}`}
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.actionTab) {
                        setActiveTab(n.actionTab);
                        onClose();
                      }
                    }}
                  >
                    <div className="notif-circle-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {n.type === 'disease' && <ScanLine size={18} style={{ color: '#d97706' }} />}
                      {n.type === 'irrigation' && <Droplets size={18} style={{ color: '#0284c7' }} />}
                      {n.type === 'scheme' && <FileText size={18} style={{ color: '#059669' }} />}
                      {n.type === 'camp' && <Calendar size={18} style={{ color: '#7c3aed' }} />}
                    </div>
                    <div className="notif-text-area">
                      <div className="notif-title-line">
                        <strong>{n.title}</strong>
                        <span className="notif-time">{n.timestamp}</span>
                      </div>
                      <p className="notif-message-text">{n.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-notifs-box">
                  <p>{t('noNotifications')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
