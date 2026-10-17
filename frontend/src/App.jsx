import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import SettingsModal from './components/SettingsModal';
import OverviewView from './components/OverviewView';
import CropClockView from './components/CropClockView';
import FairQueueView from './components/FairQueueView';
import WaterWindowView from './components/WaterWindowView';
import CampsView from './components/CampsView';
import SchemeSaathiView from './components/SchemeSaathiView';

function MainApp() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="anndata-layout">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="anndata-main-content">
        {activeTab === 'overview' && <OverviewView setActiveTab={setActiveTab} />}
        {activeTab === 'cropclock' && <CropClockView />}
        {activeTab === 'fairqueue' && <FairQueueView />}
        {activeTab === 'waterwindow' && <WaterWindowView />}
        {activeTab === 'camps' && <CampsView />}
        {activeTab === 'schemes' && <SchemeSaathiView />}
      </main>

      <footer className="anndata-footer">
        <div className="footer-content">
          <p className="footer-text">
            <strong>AnnData</strong> — Digital Agriculture Platform • CropClock • FairQueue • WaterWindow • FarmConnect • SchemeSaathi
          </p>
          <span className="footer-subtext">Designed for Indian Agriculture & Smallholder Farmers</span>
        </div>
      </footer>

      <Toast />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
