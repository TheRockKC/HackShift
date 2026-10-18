import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { checkHealth, getSavedApiUrl, setCustomApiUrl } from '../api/client';
import { translations } from '../i18n/translations';

const AppContext = createContext(null);

export const ROLES = [
  { id: 'farmer', label: 'Farmer', defaultUserId: 1, defaultFarmId: 1 },
  { id: 'buyer', label: 'Produce Buyer', defaultUserId: 2 },
  { id: 'machinery_provider', label: 'Machinery Provider', defaultUserId: 3 },
  { id: 'admin', label: 'Coordinator / Admin', defaultUserId: 4 },
];

export const DEMO_PERSONAS = [
  {
    id: 1,
    farmId: 1,
    role: 'farmer',
    name: 'Sardar Balvinder Singh',
    shortName: 'Balvinder (Farmer)',
    badge: 'Farmer: Balvinder (Ludhiana)',
    badgeHindi: 'किसान: बलविंदर (लुधियाना)',
    state: 'Punjab',
    district: 'Ludhiana',
    farmLocation: 'Jagraon Village, Ludhiana',
    farmName: 'Golden Fields Agri Farm',
    farmSizeAcres: 15.5,
    soilType: 'Loamy Alluvial Soil',
    irrigationSource: 'Tube well with solar pump & canal backup',
    mainCrops: ['Wheat HD-2967', 'Tomato (Hybrid Pusa)', 'Basmati Rice 1121'],
    email: 'balvinder.singh@smartfarming.test',
    phone: '9876500001',
  },
  {
    id: 5,
    farmId: 2,
    role: 'farmer',
    name: 'Sardar Gurpreet Singh',
    shortName: 'Gurpreet (Farmer)',
    badge: 'Farmer: Gurpreet (Jalandhar)',
    badgeHindi: 'किसान: गुरप्रीत (जालंधर)',
    state: 'Punjab',
    district: 'Jalandhar',
    farmLocation: 'Nakodar Tehsil, Jalandhar',
    farmName: 'Doaba Agri Farm',
    farmSizeAcres: 12.0,
    soilType: 'Clay Loam',
    irrigationSource: 'Canal water & Electric Tube well',
    mainCrops: ['Basmati Rice', 'Potato Kufri', 'Mustard'],
    email: 'farmer2.gurpreet@anndata.org',
    phone: '9876543215',
  },
  {
    id: 2,
    role: 'buyer',
    name: 'Karan Traders & Grain Mill',
    shortName: 'Karan Traders (Buyer)',
    badge: 'Produce Buyer: Karan Traders',
    badgeHindi: 'उपज खरीदार: करन ट्रेडर्स',
    businessName: 'Karan Traders & Aggarwal Agro',
    state: 'Punjab',
    district: 'Ludhiana',
    buyerType: 'wholesaler',
    cropsPurchased: ['Wheat', 'Tomato', 'Rice'],
    requiredQuantityTons: 50,
    email: 'buyer.karan@anndata.org',
    phone: '9876543211',
  },
  {
    id: 3,
    role: 'machinery_provider',
    name: 'Samrala Kisan Custom Hiring',
    shortName: 'Samrala CHC (Machinery)',
    badge: 'Machinery: Samrala CHC',
    badgeHindi: 'मशीनरी: समराला सीएचसी',
    state: 'Punjab',
    district: 'Ludhiana',
    email: 'provider.samrala@anndata.org',
    phone: '9876543212',
  },
];

const DEFAULT_FARMER_PROFILE = {
  id: 1,
  name: 'Sardar Balvinder Singh',
  phone: '9876500001',
  email: 'balvinder.singh@smartfarming.test',
  role: 'farmer',
  state: 'Punjab',
  district: 'Ludhiana',
  farmLocation: 'Jagraon Village, Ludhiana',
  farmSizeAcres: 15.5,
  soilType: 'Loamy Alluvial Soil',
  irrigationSource: 'Tube well with solar pump & canal backup',
  mainCrops: ['Wheat HD-2967', 'Tomato (Hybrid Pusa)', 'Basmati Rice 1121'],
  annualIncomeCategory: '₹5,00,000 - ₹10,00,000',
  preferredLanguage: 'en',
};

const DEFAULT_BUYER_PROFILE = {
  id: 66,
  name: 'Sunil Aggarwal',
  businessName: 'Aggarwal Agro Commodities Pvt Ltd',
  phone: '9876500002',
  email: 'sunil@aggarwalagro.test',
  role: 'buyer',
  buyerType: 'wholesaler',
  state: 'Punjab',
  district: 'Ludhiana',
  cropsPurchased: ['Wheat', 'Tomato', 'Rice'],
  requiredQuantityTons: 50,
  preferredQuality: 'Grade A / Export Quality',
  indicativePriceRange: '₹2,600 - ₹3,100 / Quintal',
  preferredLanguage: 'en',
};

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-scheme-1',
    type: 'scheme',
    title: 'New Scheme: PM-KISAN 17th Installment Announced',
    message: 'Direct benefit transfer of Rs 2,000 released for eligible farmers. Check e-KYC status and Aadhaar link in SchemeSaathi to avoid transfer delays.',
    category: 'Direct Benefit Transfer',
    timestamp: 'Just now',
    read: false,
    actionTab: 'schemes',
  },
  {
    id: 'notif-scheme-2',
    type: 'scheme',
    title: 'New Scheme: PM Fasal Bima Yojana (PMFBY) Rabi Window Open',
    message: 'Comprehensive crop insurance coverage for wheat and mustard at a nominal 1.5% premium. Protect against drought, unseasonal rain, and hail damage.',
    category: 'Crop Insurance',
    timestamp: '1 hour ago',
    read: false,
    actionTab: 'schemes',
  },
  {
    id: 'notif-scheme-3',
    type: 'scheme',
    title: 'New Scheme: SMAM 2026 Mechanization Subsidy',
    message: 'Sub-Mission on Agricultural Mechanization offers 40% to 50% capital subsidy on laser land levellers, seed drills, and solar sprayers.',
    category: 'Machinery Subsidy',
    timestamp: '3 hours ago',
    read: false,
    actionTab: 'schemes',
  },
  {
    id: 'notif-irrigation',
    type: 'irrigation',
    title: 'Smart Irrigation: Weather Forecast Update',
    message: '12mm rainfall predicted over the next 48 hours in your region. Postpone canal irrigation to conserve ground moisture and prevent waterlogging.',
    timestamp: '5 hours ago',
    read: true,
    actionTab: 'waterwindow',
  },
];

export const AppProvider = ({ children }) => {
  // Language Support: 'en' or 'hi'
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('hackshift_lang') || 'en';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('hackshift_lang', lang);
  };

  const t = useCallback(
    (key) => {
      const langDict = translations[language] || translations.en;
      if (langDict && langDict[key] !== undefined) {
        return langDict[key];
      }
      return translations.en[key] !== undefined ? translations.en[key] : key;
    },
    [language]
  );

  // Active Role and Auth
  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem('anndata_active_role') || 'farmer';
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('hackshift_logged_in') === 'true';
  });

  const [userId, setUserId] = useState(() => {
    const saved = localStorage.getItem('anndata_user_id');
    const val = saved ? Number(saved) : 1;
    if (!val || val > 50 || val < 1) {
      localStorage.setItem('anndata_user_id', '1');
      return 1;
    }
    return val;
  });

  const [farmId, setFarmId] = useState(() => {
    const saved = localStorage.getItem('anndata_farm_id');
    const val = saved ? Number(saved) : 1;
    if (!val || val > 50 || val < 1) {
      localStorage.setItem('anndata_farm_id', '1');
      return 1;
    }
    return val;
  });

  // User Profile
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('hackshift_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id > 50 || parsed.id < 1) {
          parsed.id = activeRole === 'buyer' ? 2 : 1;
          localStorage.setItem('hackshift_user_profile', JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {
        // fallback
      }
    }
    return activeRole === 'buyer' ? DEFAULT_BUYER_PROFILE : DEFAULT_FARMER_PROFILE;
  });

  const updateUserProfile = (updates) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updates };
      // Keep ID safe
      if (!next.id || next.id > 50 || next.id < 1) {
        next.id = activeRole === 'buyer' ? 2 : 1;
      }
      localStorage.setItem('hackshift_user_profile', JSON.stringify(next));
      return next;
    });
  };

  // Switch persona for demonstrating simultaneous farmers/buyers
  const switchPersona = (personaId) => {
    const persona = DEMO_PERSONAS.find((p) => p.id === Number(personaId)) || DEMO_PERSONAS[0];
    setUserId(persona.id);
    localStorage.setItem('anndata_user_id', String(persona.id));
    if (persona.farmId) {
      setFarmId(persona.farmId);
      localStorage.setItem('anndata_farm_id', String(persona.farmId));
    }
    setActiveRole(persona.role);
    localStorage.setItem('anndata_active_role', persona.role);
    setUserProfile(persona);
    localStorage.setItem('hackshift_user_profile', JSON.stringify(persona));
    setIsLoggedIn(true);
    localStorage.setItem('hackshift_logged_in', 'true');
    showToast(
      language === 'hi'
        ? `सक्रिय प्रोफ़ाइल बदली गई: ${persona.name} (${persona.role === 'farmer' ? 'किसान' : 'सहभागी'})`
        : `Switched active persona to ${persona.name} (${persona.role})`,
      'info'
    );
  };

  // Auth Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  const loginUser = (role, customProfile = null) => {
    setActiveRole(role);
    localStorage.setItem('anndata_active_role', role);
    setIsLoggedIn(true);
    localStorage.setItem('hackshift_logged_in', 'true');

    const validDbId = role === 'buyer' ? 2 : 1;
    const baseProfile = customProfile || (role === 'buyer' ? DEFAULT_BUYER_PROFILE : DEFAULT_FARMER_PROFILE);
    const profileToSet = {
      ...baseProfile,
      id: validDbId,
    };

    setUserProfile(profileToSet);
    localStorage.setItem('hackshift_user_profile', JSON.stringify(profileToSet));

    setUserId(validDbId);
    localStorage.setItem('anndata_user_id', String(validDbId));
    setFarmId(1);
    localStorage.setItem('anndata_farm_id', '1');
    setIsAuthModalOpen(false);
  };

  const logoutUser = () => {
    setIsLoggedIn(false);
    localStorage.setItem('hackshift_logged_in', 'false');
  };

  // Notifications
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('hackshift_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const markNotificationRead = (id) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem('hackshift_notifications', JSON.stringify(next));
      return next;
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem('hackshift_notifications', JSON.stringify(next));
      return next;
    });
  };

  const addNotification = (notif) => {
    setNotifications((prev) => {
      const item = {
        id: `notif-${Date.now()}`,
        timestamp: 'Just now',
        read: false,
        ...notif,
      };
      const next = [item, ...prev];
      localStorage.setItem('hackshift_notifications', JSON.stringify(next));
      return next;
    });
  };

  // Backend Health Status
  const [apiUrl, setApiUrl] = useState(getSavedApiUrl());
  const [backendStatus, setBackendStatus] = useState({
    checking: true,
    online: false,
    details: null,
  });
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const pingBackend = useCallback(async () => {
    setBackendStatus((prev) => ({ ...prev, checking: true }));
    try {
      const data = await checkHealth();
      setBackendStatus({
        checking: false,
        online: true,
        details: data,
      });
    } catch (err) {
      setBackendStatus({
        checking: false,
        online: false,
        details: null,
      });
    }
  }, []);

  useEffect(() => {
    pingBackend();
    const interval = setInterval(pingBackend, 30000);
    return () => clearInterval(interval);
  }, [pingBackend]);

  const changeRole = (newRole) => {
    setActiveRole(newRole);
    localStorage.setItem('anndata_active_role', newRole);
    const roleDef = ROLES.find((r) => r.id === newRole);
    if (roleDef && roleDef.defaultUserId) {
      setUserId(roleDef.defaultUserId);
      localStorage.setItem('anndata_user_id', String(roleDef.defaultUserId));
      if (roleDef.defaultFarmId) {
        setFarmId(roleDef.defaultFarmId);
        localStorage.setItem('anndata_farm_id', String(roleDef.defaultFarmId));
      }
    }
    const defaultProfile = newRole === 'buyer' ? DEFAULT_BUYER_PROFILE : DEFAULT_FARMER_PROFILE;
    setUserProfile(defaultProfile);
    localStorage.setItem('hackshift_user_profile', JSON.stringify(defaultProfile));
  };

  const updateUserId = (id) => {
    const num = Number(id);
    setUserId(num);
    localStorage.setItem('anndata_user_id', String(num));
  };

  const updateFarmId = (id) => {
    const num = Number(id);
    setFarmId(num);
    localStorage.setItem('anndata_farm_id', String(num));
  };

  const updateApiUrl = (url) => {
    setApiUrl(url);
    setCustomApiUrl(url);
    pingBackend();
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        activeRole,
        changeRole,
        isLoggedIn,
        loginUser,
        logoutUser,
        userProfile,
        updateUserProfile,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        addNotification,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        demoPersonas: DEMO_PERSONAS,
        switchPersona,
        userId,
        updateUserId,
        farmId,
        updateFarmId,
        apiUrl,
        updateApiUrl,
        backendStatus,
        pingBackend,
        toast,
        showToast,
        clearToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
