import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  X,
  Sparkles,
  CheckCircle,
  LogIn,
  UserPlus,
  Shield,
  Sprout,
  Building2,
} from 'lucide-react';
import { UserRole } from '../types';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    loginUser,
    t,
    showToast,
  } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');

  // Login form state
  const [loginPhone, setLoginPhone] = useState('9876500001');
  const [loginPassword, setLoginPassword] = useState('demo123');

  // Registration form state (Farmer)
  const [farmerReg, setFarmerReg] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    state: 'Punjab',
    district: 'Ludhiana',
    farmLocation: '',
    farmSizeAcres: 10,
    soilType: 'Alluvial Loam',
    irrigationSource: 'Tube Well with Solar Pump',
    mainCrops: 'Wheat, Tomato, Rice',
    annualIncomeCategory: '₹5,00,000 - ₹10,00,000',
  });

  // Registration form state (Buyer)
  const [buyerReg, setBuyerReg] = useState({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    password: '',
    state: 'Punjab',
    district: 'Ludhiana',
    buyerType: 'wholesaler',
    cropsPurchased: 'Wheat, Tomato, Rice',
    requiredQuantityTons: 25,
    preferredQuality: 'Grade A',
    indicativePriceRange: '₹2,600 - ₹3,000 / Quintal',
  });

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginUser(selectedRole);
    showToast(`Welcome back! Logged in as ${selectedRole === 'farmer' ? 'Farmer' : 'Produce Buyer'}.`, 'success');
  };

  const handleFarmerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = {
      id: 1,
      name: farmerReg.name || 'Sardar Gurpreet Singh',
      phone: farmerReg.phone || '9876500001',
      email: farmerReg.email || 'farmer@smartfarming.test',
      role: 'farmer' as UserRole,
      state: farmerReg.state,
      district: farmerReg.district,
      farmLocation: farmerReg.farmLocation || `${farmerReg.district} Farm`,
      farmSizeAcres: Number(farmerReg.farmSizeAcres),
      soilType: farmerReg.soilType,
      irrigationSource: farmerReg.irrigationSource,
      mainCrops: farmerReg.mainCrops.split(',').map((c) => c.trim()),
      annualIncomeCategory: farmerReg.annualIncomeCategory,
    };
    loginUser('farmer', profile);
    showToast('Registration successful! Welcome to AnnData.', 'success');
  };

  const handleBuyerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = {
      id: 2,
      name: buyerReg.name || 'Sunil Aggarwal',
      businessName: buyerReg.businessName || 'Aggarwal Agro Commodities',
      phone: buyerReg.phone || '9876500002',
      email: buyerReg.email || 'buyer@aggarwalagro.test',
      role: 'buyer' as UserRole,
      state: buyerReg.state,
      district: buyerReg.district,
      buyerType: buyerReg.buyerType as any,
      cropsPurchased: buyerReg.cropsPurchased.split(',').map((c) => c.trim()),
      requiredQuantityTons: Number(buyerReg.requiredQuantityTons),
      preferredQuality: buyerReg.preferredQuality,
      indicativePriceRange: buyerReg.indicativePriceRange,
    };
    loginUser('buyer', profile);
    showToast('Buyer account created successfully!', 'success');
  };

  return (
    <div className="modal-backdrop">
      <div className="auth-modal-sheet">
        <button
          type="button"
          className="auth-close-btn"
          onClick={() => setIsAuthModalOpen(false)}
        >
          <X size={20} />
        </button>

        <div className="auth-sheet-header">
          <div className="auth-badge-demo">
            <Sparkles size={14} /> HackShift Demo Auth
          </div>
          <h2 className="auth-sheet-title">
            {authModalMode === 'login' ? 'Log in to HackShift' : 'Register for HackShift'}
          </h2>
          <p className="auth-sheet-subtitle">
            Select your role to access personalized agronomic recommendations and marketplace trading.
          </p>
        </div>

        {/* Role Selection Segmented Control */}
        <div className="auth-role-tabs">
          <button
            type="button"
            className={`auth-role-tab ${selectedRole === 'farmer' ? 'is-active' : ''}`}
            onClick={() => setSelectedRole('farmer')}
          >
            <div className="role-icon-box" style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sprout size={18} />
            </div>
            <div>
              <div className="role-main-text">Indian Farmer</div>
              <div className="role-sub-text">Crops, Land & Advisory</div>
            </div>
          </button>

          <button
            type="button"
            className={`auth-role-tab ${selectedRole === 'buyer' ? 'is-active' : ''}`}
            onClick={() => setSelectedRole('buyer')}
          >
            <div className="role-icon-box" style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} />
            </div>
            <div>
              <div className="role-main-text">Produce Buyer</div>
              <div className="role-sub-text">Mandi Trading & Sourcing</div>
            </div>
          </button>
        </div>

        {/* Login Form */}
        {authModalMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="auth-form-body">
            <div className="form-group">
              <label className="form-label">Registered Mobile Number</label>
              <input
                type="text"
                className="form-input"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="10-digit mobile number"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <div className="demo-credentials-hint">
              <strong>Demo Quick Login:</strong> Any mobile and password will authenticate as <em>{selectedRole === 'farmer' ? 'Sardar Gurpreet Singh (Farmer)' : 'Sunil Aggarwal (Buyer)'}</em>.
            </div>

            <button type="submit" className="auth-submit-btn">
              <LogIn size={18} />
              <span>Log In as {selectedRole === 'farmer' ? 'Farmer' : 'Buyer'}</span>
            </button>

            <div className="auth-toggle-note">
              Don't have an account yet?{' '}
              <button
                type="button"
                className="inline-link-btn"
                onClick={() => setAuthModalMode('register')}
              >
                Register here
              </button>
            </div>
          </form>
        ) : (
          /* Registration Form */
          <div className="auth-form-body scrollable-reg-form">
            {selectedRole === 'farmer' ? (
              <form onSubmit={handleFarmerRegister} className="fields-stack">
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={farmerReg.name}
                      onChange={(e) => setFarmerReg({ ...farmerReg, name: e.target.value })}
                      placeholder="e.g. Sardar Gurpreet Singh"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={farmerReg.phone}
                      onChange={(e) => setFarmerReg({ ...farmerReg, phone: e.target.value })}
                      placeholder="10-digit mobile"
                      required
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={farmerReg.state}
                      onChange={(e) => setFarmerReg({ ...farmerReg, state: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">District *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={farmerReg.district}
                      onChange={(e) => setFarmerReg({ ...farmerReg, district: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Farm Size (Acres) *</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={farmerReg.farmSizeAcres}
                      onChange={(e) => setFarmerReg({ ...farmerReg, farmSizeAcres: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Soil Classification</label>
                    <input
                      type="text"
                      className="form-input"
                      value={farmerReg.soilType}
                      onChange={(e) => setFarmerReg({ ...farmerReg, soilType: e.target.value })}
                      placeholder="e.g. Alluvial Loam, Black Cotton"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Main Crops Cultivated</label>
                  <input
                    type="text"
                    className="form-input"
                    value={farmerReg.mainCrops}
                    onChange={(e) => setFarmerReg({ ...farmerReg, mainCrops: e.target.value })}
                    placeholder="e.g. Wheat, Tomato, Rice, Mustard"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Irrigation Access</label>
                  <input
                    type="text"
                    className="form-input"
                    value={farmerReg.irrigationSource}
                    onChange={(e) => setFarmerReg({ ...farmerReg, irrigationSource: e.target.value })}
                    placeholder="e.g. Tube well with canal backup"
                  />
                </div>

                <button type="submit" className="auth-submit-btn">
                  <UserPlus size={18} />
                  <span>Create Farmer Account</span>
                </button>
              </form>
            ) : (
              /* Buyer Registration Form */
              <form onSubmit={handleBuyerRegister} className="fields-stack">
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={buyerReg.name}
                      onChange={(e) => setBuyerReg({ ...buyerReg, name: e.target.value })}
                      placeholder="e.g. Sunil Aggarwal"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={buyerReg.businessName}
                      onChange={(e) => setBuyerReg({ ...buyerReg, businessName: e.target.value })}
                      placeholder="e.g. Aggarwal Agro Commodities"
                      required
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Mobile Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={buyerReg.phone}
                      onChange={(e) => setBuyerReg({ ...buyerReg, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Buyer Type *</label>
                    <select
                      className="form-input"
                      value={buyerReg.buyerType}
                      onChange={(e) => setBuyerReg({ ...buyerReg, buyerType: e.target.value })}
                    >
                      <option value="wholesaler">Wholesale Merchant</option>
                      <option value="retailer">Retail Chain</option>
                      <option value="exporter">Agri Exporter</option>
                      <option value="processor">Food Processor</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-input"
                      value={buyerReg.state}
                      onChange={(e) => setBuyerReg({ ...buyerReg, state: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">District</label>
                    <input
                      type="text"
                      className="form-input"
                      value={buyerReg.district}
                      onChange={(e) => setBuyerReg({ ...buyerReg, district: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Crops Sourced Regularly</label>
                  <input
                    type="text"
                    className="form-input"
                    value={buyerReg.cropsPurchased}
                    onChange={(e) => setBuyerReg({ ...buyerReg, cropsPurchased: e.target.value })}
                  />
                </div>

                <button type="submit" className="auth-submit-btn">
                  <UserPlus size={18} />
                  <span>Create Buyer Account</span>
                </button>
              </form>
            )}

            <div className="auth-toggle-note">
              Already registered?{' '}
              <button
                type="button"
                className="inline-link-btn"
                onClick={() => setAuthModalMode('login')}
              >
                Log in here
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
