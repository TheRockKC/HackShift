import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sprout,
  ScanLine,
  Truck,
  Droplets,
  BookOpen,
  ShoppingBag,
  Tent,
  LayoutDashboard,
  User,
  Bell,
  Globe,
  Menu,
  X,
  ChevronDown,
  RefreshCw,
  LogOut,
  LogIn,
  UserPlus,
  Users,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenNotifications,
}: HeaderProps) {
  const {
    language,
    setLanguage,
    t,
    isLoggedIn,
    logoutUser,
    setIsAuthModalOpen,
    setAuthModalMode,
    userProfile,
    notifications,
    backendStatus,
    pingBackend,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);

  const unreadNotificationsCount = notifications.filter((n: any) => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'home', label: t('home'), icon: Sprout },
    { id: 'disease', label: t('diseaseDetection'), icon: ScanLine, highlight: true },
    { id: 'fairqueue', label: t('machineryRental'), icon: Truck },
    { id: 'waterwindow', label: t('smartIrrigation'), icon: Droplets },
    { id: 'schemes', label: t('governmentSchemes'), icon: BookOpen },
    { id: 'marketplace', label: t('marketplace'), icon: ShoppingBag },
    { id: 'camps', label: t('campsEvents'), icon: Tent },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="hackshift-header">
      {/* Top Banner Bar */}
      <div className="header-top-bar">
        <div className="header-top-inner">
          <div className="brand-group" onClick={() => handleNavClick('home')} role="button" tabIndex={0}>
            <div className="brand-logo-badge">
              <Sprout size={24} className="brand-leaf-icon" />
            </div>
            <div className="brand-titles">
              <span className="brand-main-title">{t('brandName')}</span>
              <span className="brand-tagline-text">{t('brandSubtitle')}</span>
            </div>
          </div>

          <div className="header-actions-group">
            {/* Backend Connectivity Status Pill */}
            <button
              type="button"
              className={`api-status-pill ${backendStatus.online ? 'is-online' : 'is-offline'}`}
              onClick={pingBackend}
              title={backendStatus.online ? 'FastAPI Connected. Click to recheck.' : 'FastAPI Offline. Click to reconnect.'}
            >
              <span className="api-dot" />
              <span className="api-label">{backendStatus.online ? t('apiOnline') : t('apiOffline')}</span>
              <RefreshCw size={12} className={`api-spin-icon ${backendStatus.checking ? 'spinning' : ''}`} />
            </button>

            {/* Language Selector Dropdown */}
            <div className="dropdown-wrapper" ref={langMenuRef}>
              <button
                type="button"
                className="pill-button lang-toggle-btn"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                aria-label="Select Language"
              >
                <Globe size={16} />
                <span className="lang-code-text">
                  {language === 'en' ? 'English' : language === 'hi' ? 'हिंदी' : 'ਪੰਜਾਬੀ'}
                </span>
                <ChevronDown size={14} />
              </button>

              {langDropdownOpen && (
                <div className="dropdown-menu lang-dropdown-menu">
                  <button
                    type="button"
                    className={`dropdown-item ${language === 'en' ? 'active' : ''}`}
                    onClick={() => {
                      setLanguage('en');
                      setLangDropdownOpen(false);
                    }}
                  >
                    English (English)
                  </button>
                  <button
                    type="button"
                    className={`dropdown-item ${language === 'hi' ? 'active' : ''}`}
                    onClick={() => {
                      setLanguage('hi');
                      setLangDropdownOpen(false);
                    }}
                  >
                    हिन्दी (Hindi)
                  </button>
                  <button
                    type="button"
                    className={`dropdown-item ${language === 'pa' ? 'active' : ''}`}
                    onClick={() => {
                      setLanguage('pa');
                      setLangDropdownOpen(false);
                    }}
                  >
                    ਪੰਜਾਬੀ (Punjabi)
                  </button>
                </div>
              )}
            </div>

            {/* User Session Status (Synced across tabs via backend) */}
            {isLoggedIn && (
              <div
                className="user-tab-badge"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#166534',
                  background: '#f0fdf4',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
                title={language === 'hi' ? 'सक्रिय टैਬ सत्र' : language === 'pa' ? 'ਸਰਗਰਮ ਟੈਬ ਸੈਸ਼ਨ' : 'Active Tab Session'}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                <span>
                  {userProfile?.role === 'buyer'
                    ? (language === 'hi' ? 'खरीदार' : language === 'pa' ? 'ਖਰੀਦਦਾਰ' : 'Buyer')
                    : (language === 'hi' ? 'किसान' : language === 'pa' ? 'ਕਿਸਾਨ' : 'Farmer')}
                </span>
                <span style={{ color: '#475569', fontSize: '0.76rem', fontWeight: 500 }}>
                  • {userProfile?.name?.split(' ')[0] || (language === 'hi' ? 'खाता' : language === 'pa' ? 'ਖਾਤਾ' : 'User')}
                </span>
              </div>
            )}

            {/* Notification Bell */}
            <button
              type="button"
              className="icon-circle-btn notif-btn"
              onClick={onOpenNotifications}
              title={t('notifications')}
              aria-label="View notifications"
            >
              <Bell size={18} />
              {unreadNotificationsCount > 0 && (
                <span className="notif-badge-pill">{unreadNotificationsCount}</span>
              )}
            </button>

            {/* User Profile or Auth Buttons */}
            {isLoggedIn ? (
              <div className="logged-in-profile-group">
                <button
                  type="button"
                  className="pill-button profile-btn"
                  onClick={onOpenProfile}
                  title="View Profile & Settings"
                >
                  <User size={16} />
                  <span className="user-name-label">{userProfile?.name?.split(' ')[0] || t('profile')}</span>
                </button>
                <button
                  type="button"
                  className="icon-circle-btn logout-btn"
                  onClick={logoutUser}
                  title={t('logout')}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="auth-action-buttons">
                <button
                  type="button"
                  className="auth-btn login-btn"
                  onClick={() => {
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                  }}
                >
                  <LogIn size={15} />
                  <span>{t('login')}</span>
                </button>
                <button
                  type="button"
                  className="auth-btn register-btn"
                  onClick={() => {
                    setAuthModalMode('register');
                    setIsAuthModalOpen(true);
                  }}
                >
                  <UserPlus size={15} />
                  <span>{t('register')}</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Bar (Desktop) */}
      <nav className="desktop-navbar">
        <div className="navbar-links-container">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link-btn ${isActive ? 'is-active' : ''} ${item.highlight ? 'is-highlighted' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon size={17} className="nav-icon" />
                <span className="nav-text">{item.label}</span>
                {item.highlight && <span className="ai-badge">AI</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <div className="mobile-drawer-inner">
            <div className="mobile-nav-items">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`mobile-nav-link ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <Icon size={20} className="mobile-nav-icon" />
                    <span className="mobile-nav-text">{item.label}</span>
                    {item.highlight && <span className="ai-badge">AI</span>}
                  </button>
                );
              })}
            </div>

            <div className="mobile-drawer-footer">
              <div className="mobile-footer-actions">
                <button
                  type="button"
                  className="mobile-action-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenProfile();
                  }}
                >
                  <User size={18} />
                  <span>{t('profile')}</span>
                </button>
                <button
                  type="button"
                  className="mobile-action-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenNotifications();
                  }}
                >
                  <Bell size={18} />
                  <span>{t('notifications')} ({unreadNotificationsCount})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
