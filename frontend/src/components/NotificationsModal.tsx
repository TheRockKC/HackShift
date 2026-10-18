import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  X,
  CheckCheck,
  FileText,
  Droplets,
  ScanLine,
  Calendar,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
  setActiveTab,
}: NotificationsModalProps) {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    language,
    t,
  } = useApp();

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'scheme':
        return <FileText size={18} style={{ color: '#059669' }} />;
      case 'irrigation':
        return <Droplets size={18} style={{ color: '#0284c7' }} />;
      case 'disease':
        return <ScanLine size={18} style={{ color: '#d97706' }} />;
      case 'camp':
        return <Calendar size={18} style={{ color: '#7c3aed' }} />;
      default:
        return <ShieldCheck size={18} style={{ color: '#059669' }} />;
    }
  };

  const getCategoryBadge = (notif: any) => {
    if (notif.category) return notif.category;
    if (notif.type === 'scheme') {
      return language === 'hi'
        ? 'सरकारी योजना'
        : language === 'pa'
        ? 'ਸਰਕਾਰੀ ਸਕੀਮ'
        : 'Government Scheme';
    }
    if (notif.type === 'irrigation') {
      return language === 'hi'
        ? 'स्मार्ट सिंचाई'
        : language === 'pa'
        ? 'ਸਮਾਰਟ ਸਿੰਚਾਈ'
        : 'Smart Irrigation';
    }
    return language === 'hi'
      ? 'कृषि सूचना'
      : language === 'pa'
      ? 'ਖੇਤੀ ਸੂਚਨਾ'
      : 'Agronomic Advisory';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="profile-modal-card"
        style={{ maxWidth: '580px', borderRadius: '16px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.15rem 1.4rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={20} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>{t('notifications')}</span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                    }}
                  >
                    {unreadCount} {language === 'hi' ? 'नई' : language === 'pa' ? 'ਨਵੀਂਆਂ' : 'New'}
                  </span>
                )}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                {language === 'hi'
                  ? 'सरकारी योजनाओं व कृषि सलाह की ताज़ा सूचनाएं'
                  : language === 'pa'
                  ? 'ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਅਤੇ ਖੇਤੀਬਾੜੀ ਸਲਾਹ ਦੀਆਂ ਤਾਜ਼ਾ ਸੂਚਨਾਵਾਂ'
                  : 'Latest government schemes and agronomic advisory updates'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                style={{
                  background: 'transparent',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
                title={t('markAllRead')}
              >
                <CheckCheck size={14} />
                <span>{t('markAllRead')}</span>
              </button>
            )}
            <button
              type="button"
              className="close-modal-icon-btn"
              onClick={onClose}
              aria-label="Close notifications"
              style={{
                background: '#f1f5f9',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div
          style={{
            padding: '1rem 1.25rem',
            overflowY: 'auto',
            maxHeight: '62vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            background: '#f8fafc',
          }}
        >
          {notifications && notifications.length > 0 ? (
            notifications.map((notif: any) => {
              const isScheme = notif.type === 'scheme';
              return (
                <div
                  key={notif.id}
                  style={{
                    background: notif.read ? '#ffffff' : '#f0fdf4',
                    border: notif.read ? '1px solid #e2e8f0' : '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '0.9rem 1.1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: notif.read ? 'none' : '0 2px 6px -1px rgba(16, 185, 129, 0.12)',
                  }}
                  onClick={() => {
                    markNotificationRead(notif.id);
                    if (notif.actionTab) {
                      setActiveTab(notif.actionTab);
                      onClose();
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '9px',
                        background: notif.read ? '#f1f5f9' : '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          marginBottom: '0.25rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: isScheme ? '#047857' : '#0284c7',
                            background: isScheme ? '#dcfce7' : '#e0f2fe',
                            padding: '0.12rem 0.5rem',
                            borderRadius: '6px',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {getCategoryBadge(notif)}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {notif.timestamp}
                        </span>
                      </div>

                      <h4
                        style={{
                          margin: 0,
                          fontSize: '0.92rem',
                          fontWeight: notif.read ? 600 : 750,
                          color: '#1e293b',
                          lineHeight: 1.35,
                          marginBottom: '0.35rem',
                        }}
                      >
                        {notif.title}
                      </h4>

                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.82rem',
                          color: '#475569',
                          lineHeight: 1.45,
                        }}
                      >
                        {notif.message}
                      </p>

                      {notif.actionTab && (
                        <div
                          style={{
                            marginTop: '0.6rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.76rem',
                            fontWeight: 650,
                            color: '#059669',
                          }}
                        >
                          <span>
                            {isScheme
                              ? language === 'hi'
                                ? 'योजना देखें व आवेदन करें'
                                : language === 'pa'
                                ? 'ਸਕੀਮ ਦੇਖੋ ਅਤੇ ਅਰਜ਼ੀ ਦਿਓ'
                                : 'View Scheme & Apply'
                              : language === 'hi'
                              ? 'विवरण देखें'
                              : language === 'pa'
                              ? 'ਵੇਰਵੇ ਦੇਖੋ'
                              : 'View Details'}
                          </span>
                          <ExternalLink size={12} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: '#64748b',
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1',
              }}
            >
              <Bell size={28} style={{ color: '#94a3b8', margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.88rem' }}>{t('noNotifications')}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.4rem',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('schemes');
              onClose();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#059669',
              fontSize: '0.82rem',
              fontWeight: 650,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <FileText size={15} />
            <span>
              {language === 'hi'
                ? 'सभी 3 सरकारी योजनाएं देखें'
                : language === 'pa'
                ? 'ਸਾਰੀਆਂ 3 ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਦੇਖੋ'
                : 'Browse All Government Schemes'}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.45rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
