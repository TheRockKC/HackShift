import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import Toast from './components/Toast';
import SettingsModal from './components/SettingsModal';
import LandingPage from './components/LandingPage';
import DiseaseDetectionView from './components/DiseaseDetectionView';
import FairQueueView from './components/FairQueueView';
import WaterWindowView from './components/WaterWindowView';
import CampsView from './components/CampsView';
import SchemeSaathiView from './components/SchemeSaathiView';
import MarketplaceView from './components/MarketplaceView';
import FarmerDashboardView from './components/FarmerDashboardView';
import BuyerDashboardView from './components/BuyerDashboardView';
import ProfileView from './components/ProfileView';
import AuthModal from './components/AuthModal';

import NotificationsModal from './components/NotificationsModal';
import ChatbotWidget from './components/ChatbotWidget';

function MainApp() {
  const { activeRole, t } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <div className="hackshift-app-layout">
      {/* Universal Header with Navigation, Language, Role, Auth */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => {
          setIsProfileOpen(true);
        }}
        onOpenNotifications={() => {
          setIsNotificationsOpen(true);
        }}
      />

      {/* Main Routed Page Content */}
      <main className="hackshift-main-content">
        {activeTab === 'home' && <LandingPage setActiveTab={setActiveTab} />}
        {activeTab === 'disease' && <DiseaseDetectionView />}
        {activeTab === 'fairqueue' && <FairQueueView />}
        {activeTab === 'waterwindow' && <WaterWindowView />}
        {activeTab === 'schemes' && <SchemeSaathiView />}
        {activeTab === 'marketplace' && <MarketplaceView />}
        {activeTab === 'cropclock' && <MarketplaceView />}
        {activeTab === 'camps' && <CampsView />}
        {activeTab === 'dashboard' && (
          activeRole === 'buyer' ? (
            <BuyerDashboardView setActiveTab={setActiveTab} />
          ) : (
            <FarmerDashboardView setActiveTab={setActiveTab} />
          )
        )}
      </main>

      {/* Modals & Overlays */}
      <Toast />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ProfileView
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        activeSubView="profile"
        setActiveTab={setActiveTab}
      />
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        setActiveTab={setActiveTab}
      />
      <AuthModal />

      {/* Bottom Right Floating Agri Assistant Chatbot */}
      <ChatbotWidget setActiveTab={setActiveTab} />
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
