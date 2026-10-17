import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toast, clearToast } = useApp();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className={`toast-container ${toast.type}`}>
      <div className="toast-icon">
        {isSuccess && <CheckCircle size={20} className="text-emerald-500" />}
        {isError && <AlertTriangle size={20} className="text-rose-500" />}
        {!isSuccess && !isError && <Info size={20} className="text-sky-500" />}
      </div>
      <div className="toast-body">
        <p className="toast-message">{toast.message}</p>
      </div>
      <button className="toast-close" onClick={clearToast} aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
}
