import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { checkHealth, getSavedApiUrl, setCustomApiUrl } from '../api/client';

const AppContext = createContext(null);

export const ROLES = [
  { id: 'farmer', label: 'Farmer', defaultUserId: 65, defaultFarmId: 17, icon: '🌾' },
  { id: 'buyer', label: 'Produce Buyer', defaultUserId: 66, icon: '💼' },
  { id: 'machinery_provider', label: 'Machinery Provider', defaultUserId: 67, icon: '🚜' },
  { id: 'admin', label: 'Coordinator / Admin', defaultUserId: 68, icon: '🏛️' },
];

export const AppProvider = ({ children }) => {
  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem('anndata_active_role') || 'farmer';
  });

  const [userId, setUserId] = useState(() => {
    const saved = localStorage.getItem('anndata_user_id');
    return saved ? Number(saved) : 65;
  });

  const [farmId, setFarmId] = useState(() => {
    const saved = localStorage.getItem('anndata_farm_id');
    return saved ? Number(saved) : 17;
  });

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
        activeRole,
        changeRole,
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
