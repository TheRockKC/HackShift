import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import CropClockView from './CropClockView';
import {
  ShoppingBag,
  Calculator,
  TrendingUp,
  Award,
  DollarSign,
  Package,
  Truck,
  MapPin,
  CheckCircle,
  HelpCircle,
  Users,
  Search,
  Plus,
  Send,
  X,
  Phone,
  ShieldCheck,
  Building,
  ArrowRight,
  Info,
  Clock,
  Briefcase,
  Sprout,
  FileText,
  RotateCcw,
  Printer,
  Handshake,
} from 'lucide-react';
import { MandiPriceItem } from '../types';

const SAMPLE_MANDI_PRICES: MandiPriceItem[] = [
  {
    id: 'mp-1',
    crop: 'Wheat',
    variety: 'HD-2967 (Sharbati)',
    mandi: 'Khanna Grain Market',
    district: 'Ludhiana',
    state: 'Punjab',
    minPricePerQuintal: 2750,
    maxPricePerQuintal: 2980,
    modalPricePerQuintal: 2850,
    date: 'Today, 06:00 AM',
    source: 'Agmarknet / Punjab Mandi Board',
  },
  {
    id: 'mp-2',
    crop: 'Tomato',
    variety: 'Hybrid Pusa Ruby',
    mandi: 'Ludhiana Sabzi Mandi',
    district: 'Ludhiana',
    state: 'Punjab',
    minPricePerQuintal: 1650,
    maxPricePerQuintal: 2100,
    modalPricePerQuintal: 1850,
    date: 'Today, 06:30 AM',
    source: 'Agmarknet / Punjab Mandi Board',
  },
  {
    id: 'mp-3',
    crop: 'Paddy / Rice',
    variety: 'Basmati 1121',
    mandi: 'Amritsar Grain Terminal',
    district: 'Amritsar',
    state: 'Punjab',
    minPricePerQuintal: 3700,
    maxPricePerQuintal: 4150,
    modalPricePerQuintal: 3950,
    date: 'Today, 07:00 AM',
    source: 'Agmarknet / Punjab Mandi Board',
  },
  {
    id: 'mp-4',
    crop: 'Wheat',
    variety: 'PBW-550',
    mandi: 'Karnal Mandi',
    district: 'Karnal',
    state: 'Haryana',
    minPricePerQuintal: 2720,
    maxPricePerQuintal: 2900,
    modalPricePerQuintal: 2810,
    date: 'Today, 06:15 AM',
    source: 'Haryana State Agricultural Marketing Board',
  },
  {
    id: 'mp-5',
    crop: 'Cotton',
    variety: 'BT Cotton (Medium Staple)',
    mandi: 'Rajkot Marketing Yard',
    district: 'Rajkot',
    state: 'Gujarat',
    minPricePerQuintal: 6800,
    maxPricePerQuintal: 7450,
    modalPricePerQuintal: 7100,
    date: 'Today, 07:30 AM',
    source: 'Gujarat Mandi Board',
  },
  {
    id: 'mp-6',
    crop: 'Mustard',
    variety: 'Pusa Bold',
    mandi: 'Alwar Krishi Upaj Mandi',
    district: 'Alwar',
    state: 'Rajasthan',
    minPricePerQuintal: 5300,
    maxPricePerQuintal: 5850,
    modalPricePerQuintal: 5600,
    date: 'Today, 07:45 AM',
    source: 'Rajasthan Mandi Board',
  },
];

const INITIAL_BUYER_DEMANDS = [
  {
    id: 'dem-1',
    buyerName: 'Aggarwal Agro Commodities Pvt Ltd',
    buyerType: 'Certified Grain Exporter',
    cropDemanded: 'Wheat HD-2967 (Sharbati)',
    quantityNeeded: '50 Tons (500 Quintals)',
    offeredPrice: 2850,
    location: 'Ludhiana, Punjab',
    deliveryLocation: 'Focal Point Warehouse, Ludhiana',
    paymentTerms: '100% Escrow payment upon digital weighment',
    verified: true,
    contactPerson: 'Mr. Sunil Aggarwal (+91 98140 12345)',
    deadline: 'Within 10 Days',
  },
  {
    id: 'dem-2',
    buyerName: 'Punjab Flour & Milling Co-op',
    buyerType: 'Commercial Flour Mill',
    cropDemanded: 'Wheat (High Protein / Bread Grade)',
    quantityNeeded: '100 Tons (1,000 Quintals)',
    offeredPrice: 2820,
    location: 'Khanna, Ludhiana',
    deliveryLocation: 'Khanna Mill Gate',
    paymentTerms: 'Direct NEFT within 24 Hours of unloading',
    verified: true,
    contactPerson: 'Harpreet Singh (+91 98722 54321)',
    deadline: 'Immediate / Ongoing',
  },
  {
    id: 'dem-3',
    buyerName: 'Royal Basmati Rice Exports Ltd',
    buyerType: 'Rice Mill & Exporter',
    cropDemanded: 'Paddy Basmati 1121 (Moisture < 14%)',
    quantityNeeded: '80 Tons (800 Quintals)',
    offeredPrice: 3950,
    location: 'Amritsar, Punjab',
    deliveryLocation: 'Amritsar Export Hub',
    paymentTerms: 'Escrow backed, instant payment release',
    verified: true,
    contactPerson: 'Ramanjit Sehgal (+91 98888 67890)',
    deadline: 'Next 15 Days',
  },
  {
    id: 'dem-4',
    buyerName: 'FreshBasket Hypermarkets Ltd',
    buyerType: 'Direct Retail Produce Chain',
    cropDemanded: 'Tomato (Hybrid Pusa Ruby / Grade A)',
    quantityNeeded: '25 Tons (250 Quintals)',
    offeredPrice: 1950,
    location: 'Ludhiana & Jalandhar',
    deliveryLocation: 'Cold Storage Terminal 3',
    paymentTerms: 'Immediate UPI / Bank Transfer on delivery',
    verified: true,
    contactPerson: 'Anjali Verma (+91 98150 99887)',
    deadline: 'Next 5 Days',
  },
];

export default function MarketplaceView() {
  const { t, language, showToast, userProfile } = useApp();

  // Selected Action: 'farmer' or 'buyer' (User picks directly in the feature!)
  const [selectedAction, setSelectedAction] = useState<'farmer' | 'buyer'>('farmer');

  // Sub-tabs for Farmer View
  const [farmerSubTab, setFarmerSubTab] = useState<'buyers' | 'calculator' | 'mandi' | 'harvests'>('buyers');

  // Sub-tabs for Buyer View
  const [buyerSubTab, setBuyerSubTab] = useState<'post_demand' | 'browse_harvests' | 'mandi'>('post_demand');

  // Net Earnings Calculator State
  const [calcQuantityQuintals, setCalcQuantityQuintals] = useState<number>(30);
  const [calcSellingPricePerQuintal, setCalcSellingPricePerQuintal] = useState<number>(2850);
  const [calcTransportCost, setCalcTransportCost] = useState<number>(1800);
  const [calcLabourCost, setCalcLabourCost] = useState<number>(2400);
  const [calcPackagingCost, setCalcPackagingCost] = useState<number>(1200);
  const [calcMachineryCost, setCalcMachineryCost] = useState<number>(1500);
  const [calcOtherExpenses, setCalcOtherExpenses] = useState<number>(600);

  // Financial calculations
  const grossRevenue = calcQuantityQuintals * calcSellingPricePerQuintal;
  const totalDirectExpenses =
    Number(calcTransportCost) +
    Number(calcLabourCost) +
    Number(calcPackagingCost) +
    Number(calcMachineryCost) +
    Number(calcOtherExpenses);

  // Traditional Mandi Comparison (Middleman APMC Commission: ~2.5% + 1.5% Mandi Cess = 4% deduction)
  const traditionalMandiCommission = Math.round(grossRevenue * 0.04);
  const traditionalNetProfit = grossRevenue - totalDirectExpenses - traditionalMandiCommission;

  // annData Direct Sale Profit (0% middleman commission)
  const directNetProfit = grossRevenue - totalDirectExpenses;
  const extraSavings = directNetProfit - traditionalNetProfit;
  const profitMarginPercent = grossRevenue > 0 ? ((directNetProfit / grossRevenue) * 100).toFixed(1) : '0';

  // Buyer Demands State with LocalStorage Persistence
  const [buyerDemands, setBuyerDemands] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('anndata_buyer_demands');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed reading buyer demands from localStorage:', e);
    }
    return INITIAL_BUYER_DEMANDS;
  });

  // Closed Deals State with LocalStorage Persistence
  const [closedDeals, setClosedDeals] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('anndata_closed_deals');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed reading closed deals from localStorage:', e);
    }
    return [];
  });

  const [demandsFilter, setDemandsFilter] = useState<'all' | 'open' | 'sold'>('all');
  const [connectModalBuyer, setConnectModalBuyer] = useState<any>(null);
  const [sellQuantity, setSellQuantity] = useState<number>(30);
  const [receiptModalDeal, setReceiptModalDeal] = useState<any>(null);

  // Buyer Post Demand Form State
  const [newDemandForm, setNewDemandForm] = useState({
    crop: 'Wheat HD-2967',
    quantity: '40 Tons',
    offeredPrice: 2850,
    deliveryLocation: 'Ludhiana Mandi Warehouse',
    paymentTerms: '100% Escrow on Weighment',
  });

  const handlePostDemand = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = {
      id: `dem-${Date.now()}`,
      buyerName: userProfile?.name || 'Vetted Commodity Buyer',
      buyerType: 'Registered Agricultural Buyer',
      cropDemanded: newDemandForm.crop,
      quantityNeeded: newDemandForm.quantity,
      offeredPrice: Number(newDemandForm.offeredPrice),
      location: userProfile?.district ? `${userProfile.district}, ${userProfile.state}` : 'Punjab',
      deliveryLocation: newDemandForm.deliveryLocation,
      paymentTerms: newDemandForm.paymentTerms,
      verified: true,
      contactPerson: userProfile?.phone || '+91 98765 43210',
      deadline: 'Next 14 Days',
      status: 'open',
    };
    const updated = [newEntry, ...buyerDemands];
    setBuyerDemands(updated);
    try {
      localStorage.setItem('anndata_buyer_demands', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    showToast('Your procurement requirement was broadcasted to regional farmers!', 'success');
    setSelectedAction('farmer');
    setFarmerSubTab('buyers');
  };

  // Handle Farmer Confirming Direct Sale to Buyer
  const handleConfirmSale = () => {
    if (!connectModalBuyer) return;
    const contractId = `AD-DEAL-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalAmount = sellQuantity * connectModalBuyer.offeredPrice;
    const savings = Math.round(totalAmount * 0.04);
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const updatedDemands = buyerDemands.map((d: any) => {
      if (d.id === connectModalBuyer.id) {
        return {
          ...d,
          status: 'sold',
          soldQuantity: `${sellQuantity} Quintals`,
          dealTotal: totalAmount,
          contractId,
          soldAt: dateStr,
          sellerName: userProfile?.name || 'Sardar Balvinder Singh',
        };
      }
      return d;
    });

    const newDeal = {
      id: contractId,
      crop: connectModalBuyer.cropDemanded,
      buyerName: connectModalBuyer.buyerName,
      buyerType: connectModalBuyer.buyerType,
      quantity: `${sellQuantity} Quintals`,
      unitPrice: connectModalBuyer.offeredPrice,
      totalAmount,
      savings,
      date: dateStr,
      deliveryLocation: connectModalBuyer.deliveryLocation,
      contactPerson: connectModalBuyer.contactPerson,
      status: 'Escrow Locked (Active)',
    };

    setBuyerDemands(updatedDemands);
    const updatedClosedDeals = [newDeal, ...closedDeals];
    setClosedDeals(updatedClosedDeals);

    try {
      localStorage.setItem('anndata_buyer_demands', JSON.stringify(updatedDemands));
      localStorage.setItem('anndata_closed_deals', JSON.stringify(updatedClosedDeals));
    } catch (err) {
      console.error(err);
    }

    showToast(
      `Sold ${sellQuantity} Qtl of ${connectModalBuyer.cropDemanded} to ${connectModalBuyer.buyerName} for ₹${totalAmount.toLocaleString('en-IN')}! Contract #${contractId} executed.`,
      'success'
    );
    setConnectModalBuyer(null);
  };

  // Reset a specific sold demand back to open
  const handleResetDemand = (demandId: string) => {
    const updated = buyerDemands.map((d: any) => {
      if (d.id === demandId) {
        const copy = { ...d };
        delete copy.status;
        delete copy.soldQuantity;
        delete copy.dealTotal;
        delete copy.contractId;
        delete copy.soldAt;
        delete copy.sellerName;
        return copy;
      }
      return d;
    });
    setBuyerDemands(updated);
    try {
      localStorage.setItem('anndata_buyer_demands', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    showToast('Listing reset to open status.', 'info');
  };

  // Metrics for sold deals
  const soldDemands = buyerDemands.filter((d: any) => d.status === 'sold');
  const totalRealizedSales = soldDemands.reduce((sum: number, d: any) => sum + (d.dealTotal || 0), 0);
  const totalMiddlemanSaved = Math.round(totalRealizedSales * 0.04);

  return (
    <div className="marketplace-view-container">
      {/* Header Banner */}
      <div className="marketplace-header-block">
        <h1 className="marketplace-title">
          {language === 'hi' ? 'सीधा किसान-खरीदार कृषि बाज़ार' : 'Direct Farmer-to-Buyer Produce Marketplace'}
        </h1>
        <p className="marketplace-subtitle">
          {language === 'hi'
            ? 'बिचौलियों के बिना सीधे खरीदारों से जुड़ें, पारदर्शी मंडी भाव देखें और शुद्ध आय कैलकुलेटर से अपनी सही कमाई जानें।'
            : 'Access transparent farm-gate trade, direct buyer requirements, certified mandi benchmarks, and net earnings calculations with zero middleman deductions.'}
        </p>

        {/* PROMINENT ACTION SELECTOR: Farmer or Buyer */}
        <div style={{ background: '#f1f5f9', padding: '6px', borderRadius: '12px', display: 'inline-flex', gap: '8px', marginTop: '1.25rem', border: '1px solid #cbd5e1' }}>
          <button
            type="button"
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              border: 'none',
              background: selectedAction === 'farmer' ? '#065f46' : 'transparent',
              color: selectedAction === 'farmer' ? '#ffffff' : '#334155',
              fontWeight: 750,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: selectedAction === 'farmer' ? '0 2px 6px rgba(6, 95, 70, 0.3)' : 'none',
              transition: 'all 0.2s ease',
            }}
            onClick={() => setSelectedAction('farmer')}
          >
            <Sprout size={18} />
            <span>{language === 'hi' ? 'मैं किसान हूँ (फसल बेचें)' : language === 'pa' ? 'ਮੈਂ ਕਿਸਾਨ ਹਾਂ (ਫ਼ਸਲ ਵੇਚੋ)' : 'I am a Farmer (Sell Harvest)'}</span>
          </button>

          <button
            type="button"
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              border: 'none',
              background: selectedAction === 'buyer' ? '#065f46' : 'transparent',
              color: selectedAction === 'buyer' ? '#ffffff' : '#334155',
              fontWeight: 750,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: selectedAction === 'buyer' ? '0 2px 6px rgba(6, 95, 70, 0.3)' : 'none',
              transition: 'all 0.2s ease',
            }}
            onClick={() => setSelectedAction('buyer')}
          >
            <Briefcase size={18} />
            <span>{language === 'hi' ? 'मैं खरीदार हूँ (फसल खरीदें)' : language === 'pa' ? 'ਮੈਂ ਖਰੀਦਦਾਰ ਹਾਂ (ਫ਼ਸਲ ਖਰੀਦੋ)' : 'I am a Buyer (Procure Produce)'}</span>
          </button>
        </div>

        {/* Action-Specific Subtabs */}
        {selectedAction === 'farmer' && (
          <div className="marketplace-subtabs-row" style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              className={`subtab-btn ${farmerSubTab === 'buyers' ? 'active' : ''}`}
              onClick={() => setFarmerSubTab('buyers')}
            >
              <Award size={16} />
              <span>{language === 'hi' ? 'शीर्ष खरीदार और मांग' : 'Top Buyers & Specific Demands'}</span>
            </button>

            <button
              type="button"
              className={`subtab-btn ${farmerSubTab === 'calculator' ? 'active' : ''}`}
              onClick={() => setFarmerSubTab('calculator')}
            >
              <Calculator size={16} />
              <span>{language === 'hi' ? 'शुद्ध कमाई कैलकुलेटर' : 'Net Earnings Calculator'}</span>
            </button>

            <button
              type="button"
              className={`subtab-btn ${farmerSubTab === 'mandi' ? 'active' : ''}`}
              onClick={() => setFarmerSubTab('mandi')}
            >
              <TrendingUp size={16} />
              <span>{language === 'hi' ? 'मंडी के भाव (Mandi Rates)' : 'Mandi Price Benchmarks'}</span>
            </button>

            <button
              type="button"
              className={`subtab-btn ${farmerSubTab === 'harvests' ? 'active' : ''}`}
              onClick={() => setFarmerSubTab('harvests')}
            >
              <ShoppingBag size={16} />
              <span>{language === 'hi' ? 'मेरी फसल सूची (CropClock)' : 'My Harvest Listings'}</span>
            </button>
          </div>
        )}

        {selectedAction === 'buyer' && (
          <div className="marketplace-subtabs-row" style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              className={`subtab-btn ${buyerSubTab === 'post_demand' ? 'active' : ''}`}
              onClick={() => setBuyerSubTab('post_demand')}
            >
              <Plus size={16} />
              <span>{language === 'hi' ? 'खरीद मांग पोस्ट करें' : 'Post Purchase Requirement'}</span>
            </button>

            <button
              type="button"
              className={`subtab-btn ${buyerSubTab === 'browse_harvests' ? 'active' : ''}`}
              onClick={() => setBuyerSubTab('browse_harvests')}
            >
              <ShoppingBag size={16} />
              <span>{language === 'hi' ? 'किसानों की फसलें देखें' : 'Browse Farmer Harvests'}</span>
            </button>

            <button
              type="button"
              className={`subtab-btn ${buyerSubTab === 'mandi' ? 'active' : ''}`}
              onClick={() => setBuyerSubTab('mandi')}
            >
              <TrendingUp size={16} />
              <span>{language === 'hi' ? 'मंडी के भाव' : 'Mandi Benchmarks'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FARMER VIEW 1: TOP BUYERS WITH SPECIFIC DEMANDS                           */}
      {/* ========================================================================= */}
      {selectedAction === 'farmer' && farmerSubTab === 'buyers' && (
        <div className="tab-pane-content">
          {/* REALIZED SALES SUMMARY BANNER */}
          {soldDemands.length > 0 && (
            <div
              style={{
                background: '#ecfdf5',
                border: '1.5px solid #6ee7b7',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.08)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 750, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {language === 'hi' ? 'मेरी प्रत्यक्ष बिक्री का सारांश' : language === 'pa' ? 'ਮੇਰੀ ਸਿੱਧੀ ਵਿਕਰੀ ਦਾ ਸੰਖੇਪ' : 'My Realized Direct Sales Summary'}
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#064e3b' }}>
                    ₹{totalRealizedSales.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '0.86rem', color: '#047857', fontWeight: 600 }}>
                    {language === 'hi'
                      ? `${soldDemands.length} निष्पादित व्यापार समझौतों से कुल किसान आय`
                      : `Direct farmer earnings across ${soldDemands.length} executed trade agreement${soldDemands.length > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ background: '#ffffff', padding: '6px 14px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 600 }}>
                    {language === 'hi' ? 'बिचौलियों की दलाली बचत' : 'MIDDLEMAN BROKERAGE SAVED'}
                  </div>
                  <strong style={{ fontSize: '1rem', color: '#047857' }}>
                    ₹{totalMiddlemanSaved.toLocaleString('en-IN')} {language === 'hi' ? '(0% मंडी टैक्स)' : '(0% APMC Fees)'}
                  </strong>
                </div>
                <div style={{ background: '#d1fae5', color: '#065f46', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheck size={17} /> {language === 'hi' ? '100% एस्क्रो सुरक्षित' : '100% Escrow Protected'}
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar & Header */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={20} style={{ color: '#059669' }} /> {language === 'hi' ? 'सत्यापित व्यावसायिक खरीद मांगें' : 'Verified Commercial Procurement Demands'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                {language === 'hi'
                  ? 'सत्यापित मिलों, निर्यातकों और खुदरा कंपनियों को सीधे फसल बेचें। डिजिटल एस्क्रो भुगतान गारंटी के साथ सुरक्षित।'
                  : 'Sell directly to verified mills, exporters, and retail chains. All transactions protected with digital escrow guarantees.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: demandsFilter === 'all' ? '#059669' : '#cbd5e1',
                  background: demandsFilter === 'all' ? '#059669' : '#ffffff',
                  color: demandsFilter === 'all' ? '#ffffff' : '#475569',
                  fontSize: '0.82rem',
                  fontWeight: 650,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setDemandsFilter('all')}
              >
                {language === 'hi' ? `सभी मांगें (${buyerDemands.length})` : `All Demands (${buyerDemands.length})`}
              </button>
              <button
                type="button"
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: demandsFilter === 'open' ? '#059669' : '#cbd5e1',
                  background: demandsFilter === 'open' ? '#059669' : '#ffffff',
                  color: demandsFilter === 'open' ? '#ffffff' : '#475569',
                  fontSize: '0.82rem',
                  fontWeight: 650,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setDemandsFilter('open')}
              >
                {language === 'hi' ? `उपलब्ध (${buyerDemands.filter((d: any) => d.status !== 'sold').length})` : `Open (${buyerDemands.filter((d: any) => d.status !== 'sold').length})`}
              </button>
              <button
                type="button"
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: demandsFilter === 'sold' ? '#059669' : '#cbd5e1',
                  background: demandsFilter === 'sold' ? '#059669' : '#ffffff',
                  color: demandsFilter === 'sold' ? '#ffffff' : '#475569',
                  fontSize: '0.82rem',
                  fontWeight: 650,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setDemandsFilter('sold')}
              >
                {language === 'hi' ? `स्वीकृत सौदे (${soldDemands.length})` : `Sold to You (${soldDemands.length})`}
              </button>
            </div>
          </div>

          {/* Demands Grid */}
          <div className="ranked-buyers-list" style={{ display: 'grid', gap: '1.25rem' }}>
            {buyerDemands
              .filter((buyer: any) => {
                if (demandsFilter === 'open') return buyer.status !== 'sold';
                if (demandsFilter === 'sold') return buyer.status === 'sold';
                return true;
              })
              .map((buyer, idx) => {
                const isSold = buyer.status === 'sold';
                return (
                  <div
                    key={buyer.id}
                    style={{
                      background: isSold ? '#f0fdf4' : '#ffffff',
                      border: isSold ? '2px solid #10b981' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1.25rem 1.5rem',
                      boxShadow: isSold ? '0 4px 14px rgba(16, 185, 129, 0.12)' : '0 2px 6px rgba(0,0,0,0.04)',
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1.2fr 0.8fr',
                      alignItems: 'center',
                      gap: '1.5rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Column 1: Buyer Info */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        {isSold ? (
                          <span
                            style={{
                              background: '#059669',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: 750,
                              padding: '3px 9px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <CheckCircle size={12} /> {language === 'hi' ? 'सौदा पक्का / आपको आवंटित' : 'SOLD / COMMITTED TO YOU'}
                          </span>
                        ) : (
                          <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 750, padding: '2px 8px', borderRadius: '4px' }}>
                            #{idx + 1} {language === 'hi' ? 'प्राथमिकता मिलान' : 'Priority Match'}
                          </span>
                        )}

                        {buyer.verified && (
                          <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 650, padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle size={11} /> {language === 'hi' ? 'सत्यापित खरीदार' : 'Verified Buyer'}
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', color: '#1e293b' }}>{buyer.buyerName}</h4>
                      <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                        {buyer.buyerType} • {buyer.location}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#047857', fontWeight: 600, marginTop: '0.35rem' }}>
                        {language === 'hi' ? 'डिलीवरी स्थान:' : 'Delivery:'} {buyer.deliveryLocation}
                      </div>
                    </div>

                    {/* Column 2: Specific Demand & Price */}
                    <div style={{ background: isSold ? '#ffffff' : '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: isSold ? '1px solid #86efac' : '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {language === 'hi' ? 'मांगी गई फसल:' : 'Specific Crop Demand:'}
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 750, color: '#0f172a', margin: '0.2rem 0' }}>
                        {buyer.cropDemanded}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{language === 'hi' ? 'वांछित मात्रा:' : 'Volume Desired:'}</span>
                          <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>{buyer.quantityNeeded}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{language === 'hi' ? 'प्रस्तावित दर:' : 'Offered Price:'}</span>
                          <div style={{ fontWeight: 800, color: '#166534', fontSize: '1.15rem' }}>
                            ₹{buyer.offeredPrice.toLocaleString()} <span style={{ fontSize: '0.8rem' }}>{language === 'hi' ? '/ क्विंटल' : '/ Qtl'}</span>
                          </div>
                        </div>
                      </div>

                      {/* If Sold: Show Trade Agreement Confirmation */}
                      {isSold ? (
                        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '6px', padding: '6px 10px', marginTop: '0.65rem' }}>
                          <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Handshake size={14} /> {language === 'hi' ? `अनुबंध #${buyer.contractId || 'AD-DEAL-01'} निष्पादित` : `Contract #${buyer.contractId || 'AD-DEAL-01'} Executed`}
                          </div>
                          <div style={{ fontSize: '0.84rem', color: '#14532d', marginTop: '2px', fontWeight: 650 }}>
                            {language === 'hi' ? 'प्रतिबद्ध मात्रा:' : 'Committed:'} <strong>{buyer.soldQuantity || '30 Quintals'}</strong> • {language === 'hi' ? 'प्राप्त भुगतान:' : 'Realized Payout:'}{' '}
                            <strong style={{ color: '#047857' }}>
                              ₹{Number(buyer.dealTotal || (buyer.offeredPrice * 30)).toLocaleString('en-IN')}
                            </strong>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '2px' }}>
                            {language === 'hi'
                              ? `एस्क्रो सुरक्षित ${buyer.soldAt || 'आज'} • समन्वयक: ${buyer.contactPerson}`
                              : `Direct escrow locked on ${buyer.soldAt || 'Today'} • Coordinator: ${buyer.contactPerson}`}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: '#2563eb', marginTop: '0.35rem' }}>
                          {buyer.paymentTerms}
                        </div>
                      )}
                    </div>

                    {/* Column 3: Action Buttons */}
                    <div style={{ textAlign: 'center' }}>
                      {isSold ? (
                        <div>
                          <button
                            type="button"
                            style={{
                              width: '100%',
                              background: '#047857',
                              color: '#ffffff',
                              border: 'none',
                              padding: '10px 16px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)',
                            }}
                            onClick={() => setReceiptModalDeal(buyer)}
                          >
                            <FileText size={15} />
                            <span>{language === 'hi' ? 'व्यापार रसीद देखें' : 'View Trade Receipt'}</span>
                          </button>
                          <button
                            type="button"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              fontSize: '0.75rem',
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              marginTop: '0.5rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                            onClick={() => handleResetDemand(buyer.id)}
                            title="Revert status to open demand"
                          >
                            <RotateCcw size={11} /> {language === 'hi' ? 'पुनः खोलें' : 'Re-open Listing'}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <button
                            type="button"
                            style={{
                              width: '100%',
                              background: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              padding: '10px 16px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                            }}
                            onClick={() => {
                              setSellQuantity(30);
                              setConnectModalBuyer(buyer);
                            }}
                          >
                            <span>{language === 'hi' ? 'संपर्क करें और बेचें' : 'Connect & Sell'}</span>
                            <ArrowRight size={15} />
                          </button>
                          <span style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                            {language === 'hi' ? 'समय सीमा:' : 'Window:'} {buyer.deadline}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FARMER VIEW 2: ESTIMATED NET EARNINGS CALCULATOR                          */}
      {/* ========================================================================= */}
      {selectedAction === 'farmer' && farmerSubTab === 'calculator' && (
        <div className="tab-pane-content">
          <div className="calculator-workspace-grid">
            {/* Input Form Card */}
            <div className="calc-inputs-card">
              <h3 className="calc-card-title">{t('calculateNetEarningsTitle')}</h3>
              <p className="calc-card-sub">
                Enter your expected harvest yield, target sale price, and logistical expenses to uncover true take-home earnings.
              </p>

              <div className="calc-fields-grid">
                <div className="form-group">
                  <label className="form-label">{t('quantityQuintals')}</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={calcQuantityQuintals}
                    onChange={(e) => setCalcQuantityQuintals(Math.max(1, Number(e.target.value)))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('askingPrice')}</label>
                  <input
                    type="number"
                    min="100"
                    className="form-input"
                    value={calcSellingPricePerQuintal}
                    onChange={(e) => setCalcSellingPricePerQuintal(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('transportCost')}</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={calcTransportCost}
                    onChange={(e) => setCalcTransportCost(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('labourCost')}</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={calcLabourCost}
                    onChange={(e) => setCalcLabourCost(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('packagingCost')}</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={calcPackagingCost}
                    onChange={(e) => setCalcPackagingCost(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('machineryCost')}</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={calcMachineryCost}
                    onChange={(e) => setCalcMachineryCost(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('otherExpenses')}</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={calcOtherExpenses}
                    onChange={(e) => setCalcOtherExpenses(Math.max(0, Number(e.target.value)))}
                  />
                </div>
              </div>
            </div>

            {/* Calculations & Profit Breakdown Card */}
            <div className="calc-results-card">
              <h3 className="results-card-title">{language === 'hi' ? 'शुद्ध वित्तीय सारांश' : 'Net Financial Summary'}</h3>

              {/* Gross Revenue */}
              <div className="revenue-stat-box">
                <span className="lbl">{t('grossRevenue')}</span>
                <strong className="val">₹{grossRevenue.toLocaleString('en-IN')}</strong>
                <span className="math-hint">({calcQuantityQuintals} Qtl × ₹{calcSellingPricePerQuintal}/Qtl)</span>
              </div>

              {/* Total Expenses */}
              <div className="expenses-stat-box">
                <span className="lbl">{t('totalExpenses')}</span>
                <strong className="val-red">- ₹{totalDirectExpenses.toLocaleString('en-IN')}</strong>
                <span className="math-hint">{language === 'hi' ? 'परिवहन + श्रम + बोरियां + मशीनरी' : 'Transport + Labour + Bags + Machinery'}</span>
              </div>

              {/* annData Direct Net Profit */}
              <div className="net-profit-hero-box" style={{ background: '#f0fdf4', border: '1.5px solid #86efac' }}>
                <span className="lbl" style={{ color: '#166534', fontWeight: 700 }}>
                  {language === 'hi' ? 'annData शुद्ध लाभ (0% कमीशन)' : 'annData Take-Home Net Profit (0% Commission)'}
                </span>
                <strong className="val-green" style={{ fontSize: '2rem', color: '#14532d' }}>
                  ₹{directNetProfit.toLocaleString('en-IN')}
                </strong>
                <div className="margin-pill" style={{ background: '#dcfce7', color: '#166534' }}>
                  {language === 'hi' ? 'लाभ मार्जिन:' : 'Profit Margin:'} <strong>{profitMarginPercent}%</strong>
                </div>
              </div>

              {/* Mandi Middleman Comparison */}
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.85rem 1rem', marginTop: '1rem' }}>
                <div style={{ fontSize: '0.84rem', color: '#991b1b', fontWeight: 700 }}>
                  {language === 'hi' ? 'पारंपरिक मंडी से तुलना' : 'Traditional Mandi Comparison'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '2px' }}>
                  {language === 'hi'
                    ? `पारंपरिक आढ़ती / एपीएमसी मंडी कमीशन (लगभग 4%): `
                    : `Traditional APMC Mandi Arhtiya / Commission (approx. 4%): `}
                  <strong>-₹{traditionalMandiCommission.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#15803d', marginTop: '4px' }}>
                  {language === 'hi'
                    ? `annData पर सीधे बेचने से आपके ₹${extraSavings.toLocaleString('en-IN')} बिचौलियों के बचे!`
                    : `Selling directly on annData saves you ₹${extraSavings.toLocaleString('en-IN')} in middleman fees!`}
                </div>
              </div>

              <div className="calc-disclaimer-note" style={{ marginTop: '1rem' }}>
                <Info size={15} />
                <span>{t('netEarningsExplanation')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANDI BENCHMARK PRICES (Shared across Farmer & Buyer)                     */}
      {/* ========================================================================= */}
      {((selectedAction === 'farmer' && farmerSubTab === 'mandi') ||
        (selectedAction === 'buyer' && buyerSubTab === 'mandi')) && (
        <div className="tab-pane-content">
          <div className="mandi-disclaimer-banner">
            <HelpCircle size={18} className="info-icon" />
            <div>
              <strong>{language === 'hi' ? 'सरकारी मंडी बेंचमार्क:' : 'Government Mandi Benchmarks:'}</strong>{' '}
              {language === 'hi'
                ? 'उचित मूल्य निर्धारण हेतु पंजाब, हरियाणा, राजस्थान और गुजरात की एपीएमसी मंडियों के लाइव मॉडल भाव।'
                : 'Live modal rates recorded across Punjab, Haryana, Rajasthan, and Gujarat APMCs for fair price discovery.'}
            </div>
          </div>

          <div className="mandi-table-wrapper">
            <table className="mandi-table">
              <thead>
                <tr>
                  <th>{language === 'hi' ? 'फसल और किस्म' : 'Crop & Variety'}</th>
                  <th>{language === 'hi' ? 'मंडी / यार्ड' : 'Mandi / Yard'}</th>
                  <th>{language === 'hi' ? 'स्थान' : 'Location'}</th>
                  <th>{language === 'hi' ? 'न्यूनतम भाव' : 'Min Price'}</th>
                  <th>{language === 'hi' ? 'अधिकतम भाव' : 'Max Price'}</th>
                  <th>{language === 'hi' ? 'मॉडल (उचित) भाव' : 'Modal (Fair) Price'}</th>
                  <th>{language === 'hi' ? 'डेटा स्रोत' : 'Data Source'}</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_MANDI_PRICES.map((item) => (
                  <tr key={item.id}>
                    <td className="crop-cell">
                      <strong>{item.crop}</strong>
                      <span className="variety-sub">{item.variety}</span>
                    </td>
                    <td>{item.mandi}</td>
                    <td>{item.district}, {item.state}</td>
                    <td className="price-val">₹{item.minPricePerQuintal.toLocaleString()}</td>
                    <td className="price-val">₹{item.maxPricePerQuintal.toLocaleString()}</td>
                    <td className="price-highlight">
                      <strong>₹{item.modalPricePerQuintal.toLocaleString()}</strong> / Qtl
                    </td>
                    <td className="source-sub">{item.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FARMER VIEW 4: MY HARVEST LISTINGS (CropClock Integration)                 */}
      {/* ========================================================================= */}
      {selectedAction === 'farmer' && farmerSubTab === 'harvests' && (
        <div className="tab-pane-content">
          <CropClockView />
        </div>
      )}

      {/* ========================================================================= */}
      {/* BUYER VIEW 1: POST PROCUREMENT REQUIREMENT / DEMAND                       */}
      {/* ========================================================================= */}
      {selectedAction === 'buyer' && buyerSubTab === 'post_demand' && (
        <div className="tab-pane-content">
          <div style={{ maxWidth: '780px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <Building size={22} style={{ color: '#059669' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
                  {language === 'hi' ? 'व्यावसायिक फसल खरीद मांग पोस्ट करें' : 'Post Commercial Crop Procurement Demand'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                  {language === 'hi'
                    ? 'आपकी खरीद मांग तुरंत किसान पोर्टल पर दिखाई जाएगी ताकि क्षेत्रीय किसान सीधे अपनी फसल बेच सकें।'
                    : "Your demand will be immediately listed in the farmers' portal so regional producers can propose direct lots."}
                </p>
              </div>
            </div>

            <form onSubmit={handlePostDemand}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 650, fontSize: '0.88rem' }}>
                    {language === 'hi' ? 'आवश्यक फसल और किस्म' : 'Required Crop & Variety'}
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newDemandForm.crop}
                    onChange={(e) => setNewDemandForm({ ...newDemandForm, crop: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 650, fontSize: '0.88rem' }}>
                    {language === 'hi' ? 'वांछित मात्रा (टन या क्विंटल)' : 'Quantity Desired (Tons or Quintals)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'hi' ? 'उदा. 50 टन / 500 क्विंटल' : 'e.g. 50 Tons / 500 Quintals'}
                    className="form-input"
                    value={newDemandForm.quantity}
                    onChange={(e) => setNewDemandForm({ ...newDemandForm, quantity: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 650, fontSize: '0.88rem' }}>
                    {language === 'hi' ? 'प्रस्तावित दर (₹ / क्विंटल)' : 'Offered Price (₹ / Quintal)'}
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    className="form-input"
                    value={newDemandForm.offeredPrice}
                    onChange={(e) => setNewDemandForm({ ...newDemandForm, offeredPrice: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 650, fontSize: '0.88rem' }}>
                    {language === 'hi' ? 'निर्दिष्ट वितरण / गोदाम स्थान' : 'Designated Delivery Location'}
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newDemandForm.deliveryLocation}
                    onChange={(e) => setNewDemandForm({ ...newDemandForm, deliveryLocation: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 650, fontSize: '0.88rem' }}>
                  {language === 'hi' ? 'भुगतान और एस्क्रो गारंटी' : 'Payment & Escrow Guarantee'}
                </label>
                <select
                  className="form-input"
                  value={newDemandForm.paymentTerms}
                  onChange={(e) => setNewDemandForm({ ...newDemandForm, paymentTerms: e.target.value })}
                >
                  <option value="100% Escrow on Weighment">
                    {language === 'hi' ? 'तुलाई पर 100% एस्क्रो भुगतान (किसानों का सर्वोच्च भरोसा)' : '100% Escrow on Weighment (Highest Farmer Trust)'}
                  </option>
                  <option value="Direct NEFT within 24 Hours">
                    {language === 'hi' ? 'अनलोडिंग के 24 घंटे के भीतर सीधा NEFT' : 'Direct NEFT within 24 Hours of unloading'}
                  </option>
                  <option value="Instant UPI / Bank Transfer on Gate Delivery">
                    {language === 'hi' ? 'गेट डिलीवरी पर तुरंत UPI / बैंक ट्रांसफर' : 'Instant UPI / Bank Transfer on Gate Delivery'}
                  </option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 750,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <Send size={18} />
                <span>{language === 'hi' ? 'किसानों को खरीद मांग भेजें' : 'Broadcast Procurement Demand to Farmers'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BUYER VIEW 2: BROWSE FARMER HARVESTS                                      */}
      {/* ========================================================================= */}
      {selectedAction === 'buyer' && buyerSubTab === 'browse_harvests' && (
        <div className="tab-pane-content">
          <CropClockView />
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONNECT WITH BUYER MODAL (FOR FARMERS TO SELL PRODUCE)                     */}
      {/* ========================================================================= */}
      {connectModalBuyer && (
        <div className="modal-backdrop">
          <div className="modal-window" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Handshake size={20} /> {language === 'hi' ? 'सीधी बिक्री एवं व्यापार समझौता' : 'Direct Sale & Trade Agreement'}
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {language === 'hi' ? 'खरीदार:' : 'Buyer:'} {connectModalBuyer.buyerName}
                </span>
              </div>
              <button type="button" className="btn-close" onClick={() => setConnectModalBuyer(null)}>
                ×
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem' }}>
              {/* Buyer Proposal Banner */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1rem', marginBottom: '1.15rem' }}>
                <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {language === 'hi' ? 'खरीदार की आधिकारिक खरीद शर्तें' : "BUYER'S COMMITTED PROCUREMENT TERMS"}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.35rem' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#14532d' }}>
                    ₹{connectModalBuyer.offeredPrice.toLocaleString('en-IN')}{' '}
                    <span style={{ fontSize: '0.85rem' }}>{language === 'hi' ? '/ क्विंटल' : '/ Quintal'}</span>
                  </div>
                  <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.78rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                    {connectModalBuyer.buyerType}
                  </span>
                </div>
                <div style={{ fontSize: '0.86rem', color: '#15803d', marginTop: '0.35rem' }}>
                  {language === 'hi' ? 'मांगी गई फसल:' : 'Required Crop:'} <strong>{connectModalBuyer.cropDemanded}</strong> •{' '}
                  {language === 'hi' ? 'वांछित लॉट:' : 'Desired Lot:'} <strong>{connectModalBuyer.quantityNeeded}</strong>
                </div>
              </div>

              {/* Farmer Sell Quantity Input */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 750, color: '#1e293b', marginBottom: '0.4rem' }}>
                  {language === 'hi' ? 'बेचने के लिए मात्रा चुनें (क्विंटल):' : 'Select Quantity to Sell (Quintals):'}
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(Math.max(1, Number(e.target.value)))}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[10, 25, 50, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: sellQuantity === preset ? '#059669' : '#ffffff',
                          color: sellQuantity === preset ? '#ffffff' : '#334155',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        onClick={() => setSellQuantity(preset)}
                      >
                        {preset} {language === 'hi' ? 'क्विंटल' : 'Qtl'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Realized Financial Summary */}
                <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      {language === 'hi' ? 'अनुमानित कुल भुगतान:' : 'Estimated Gross Payout:'}
                    </span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>
                      ₹{(sellQuantity * connectModalBuyer.offeredPrice).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      {language === 'hi' ? 'बिचौलियों की बचत:' : 'Middleman Commission Saved:'}
                    </span>
                    <div style={{ fontSize: '1rem', fontWeight: 750, color: '#166534' }}>
                      +₹{Math.round(sellQuantity * connectModalBuyer.offeredPrice * 0.04).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery & Security Details */}
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', marginBottom: '1rem' }}>
                <div><strong>{language === 'hi' ? 'निर्दिष्ट वितरण केंद्र:' : 'Designated Delivery Hub:'}</strong> {connectModalBuyer.deliveryLocation}</div>
                <div><strong>{language === 'hi' ? 'भुगतान सुरक्षा:' : 'Payment Security:'}</strong> {connectModalBuyer.paymentTerms}</div>
                <div><strong>{language === 'hi' ? 'खरीदार प्रतिनिधि:' : 'Buyer Representative:'}</strong> {connectModalBuyer.contactPerson}</div>
              </div>

              <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '0.8rem', color: '#065f46', lineHeight: 1.4 }}>
                <strong>{language === 'hi' ? '100% annData डिजिटल एस्क्रो गारंटी:' : '100% annData Digital Escrow Guarantee:'}</strong>{' '}
                {language === 'hi'
                  ? 'पुष्टि करते ही खरीदार की खरीद राशि कानूनी रूप से एस्क्रो खाते में लॉक हो जाती है। तुलाई के तुरंत बाद आपके बैंक खाते में भेजी जाती है।'
                  : 'Upon clicking "Confirm Sale & Lock Deal", the buyer\'s procurement escrow deposit is legally allocated to your account. Payout is released directly into your bank account immediately upon weighment.'}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setConnectModalBuyer(null)}>
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#059669', borderColor: '#059669', fontWeight: 750, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleConfirmSale}
              >
                <CheckCircle size={17} />
                <span>{language === 'hi' ? 'सौदा पक्का करें और लॉक करें' : 'Confirm Sale & Lock Deal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRADE CONTRACT RECEIPT & CERTIFICATE MODAL                                */}
      {/* ========================================================================= */}
      {receiptModalDeal && (
        <div className="modal-backdrop">
          <div className="modal-window" style={{ maxWidth: '580px' }}>
            <div className="modal-header" style={{ background: '#f0fdf4', borderBottom: '1.5px solid #86efac' }}>
              <div>
                <h3 style={{ margin: 0, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.15rem' }}>
                  <ShieldCheck size={22} /> {language === 'hi' ? 'annData प्रत्यक्ष व्यापार अनुबंध प्रमाण पत्र' : 'annData Direct Trade Contract Certificate'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600 }}>
                  {language === 'hi' ? 'अनुबंध #' : 'Contract #'}{receiptModalDeal.contractId || 'AD-DEAL-VERIFIED'} • {language === 'hi' ? 'स्थिति: 100% एस्क्रो सुरक्षित' : 'Status: 100% Escrow Secured'}
                </span>
              </div>
              <button type="button" className="btn-close" onClick={() => setReceiptModalDeal(null)}>
                ×
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              {/* Certificate Seal Box */}
              <div style={{ border: '2px dashed #059669', borderRadius: '12px', padding: '1.25rem', background: '#ffffff', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {language === 'hi' ? 'आधिकारिक व्यापार रिकॉर्ड' : 'OFFICIAL TRADE RECORD'}
                    </span>
                    <h4 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', color: '#0f172a' }}>
                      {language === 'hi' ? 'प्रत्यक्ष कृषि उपज बिक्री समझौता' : 'Direct Produce Sale Agreement'}
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {language === 'hi' ? 'सौदा निष्पादन तिथि' : 'EXECUTION DATE'}
                    </span>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.88rem' }}>
                      {receiptModalDeal.soldAt || new Date().toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Parties Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>
                      {language === 'hi' ? 'विक्रेता (उत्पादक किसान)' : 'SELLER (PRODUCER)'}
                    </span>
                    <div style={{ fontWeight: 750, color: '#0f172a', fontSize: '0.92rem', marginTop: '2px' }}>
                      {receiptModalDeal.sellerName || 'Sardar Balvinder Singh'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Golden Fields Farm • Ludhiana, PB</div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>
                      {language === 'hi' ? 'खरीदार (व्यावसायिक खरीददार)' : 'BUYER (PROCUREMENT)'}
                    </span>
                    <div style={{ fontWeight: 750, color: '#0f172a', fontSize: '0.92rem', marginTop: '2px' }}>
                      {receiptModalDeal.buyerName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{receiptModalDeal.buyerType}</div>
                  </div>
                </div>

                {/* Commodity & Financials Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', marginBottom: '1rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>
                        {language === 'hi' ? 'फसल और किस्म:' : 'Commodity & Variety:'}
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {receiptModalDeal.cropDemanded}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>
                        {language === 'hi' ? 'अनुबंधित मात्रा:' : 'Contracted Volume:'}
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {receiptModalDeal.soldQuantity || '30 Quintals'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>
                        {language === 'hi' ? 'सहमत दर:' : 'Agreed Rate:'}
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹{receiptModalDeal.offeredPrice?.toLocaleString('en-IN')} {language === 'hi' ? '/ क्विंटल' : '/ Quintal'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1.5px solid #059669', background: '#f0fdf4' }}>
                      <td style={{ padding: '8px 6px', fontWeight: 800, color: '#166534', fontSize: '0.95rem' }}>
                        {language === 'hi' ? 'कुल प्राप्त किसान भुगतान:' : 'Total Realized Farmer Payout:'}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800, color: '#14532d', fontSize: '1.15rem' }}>
                        ₹{Number(receiptModalDeal.dealTotal || (receiptModalDeal.offeredPrice * 30)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Middleman Savings Note */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#065f46', fontWeight: 650 }}>
                  <span>{language === 'hi' ? 'बिचौलिया / आढ़त कटौती: ₹0.00' : 'Middleman APMC Deduction: ₹0.00'}</span>
                  <span>{language === 'hi' ? 'सीधी बचत: ' : 'Direct Savings: '}+₹{Math.round(Number(receiptModalDeal.dealTotal || (receiptModalDeal.offeredPrice * 30)) * 0.04).toLocaleString('en-IN')}</span>
                </div>

                <div style={{ marginTop: '0.85rem', fontSize: '0.78rem', color: '#64748b', display: 'grid', gap: '3px' }}>
                  <div><strong>{language === 'hi' ? 'निर्दिष्ट केंद्र:' : 'Designated Hub:'}</strong> {receiptModalDeal.deliveryLocation}</div>
                  <div><strong>{language === 'hi' ? 'अधिकृत संपर्क:' : 'Authorized Contact:'}</strong> {receiptModalDeal.contactPerson}</div>
                  <div><strong>{language === 'hi' ? 'डिजिटल सुरक्षा हैश:' : 'Digital Security Hash:'}</strong> AD-SHA256-ESCROW-{receiptModalDeal.contractId || '84920'}</div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  window.print();
                }}
              >
                <Printer size={16} /> {language === 'hi' ? 'रसीद प्रिंट करें' : 'Print Receipt'}
              </button>
              <button type="button" className="btn btn-primary" style={{ background: '#059669', borderColor: '#059669' }} onClick={() => setReceiptModalDeal(null)}>
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
