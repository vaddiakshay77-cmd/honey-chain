import React from 'react';
import { HoneyChainProvider, useHoneyChain } from './context/HoneyChainContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { BeekeeperRegistrationPage } from './pages/BeekeeperRegistrationPage';
import { BatchEntryPage } from './pages/BatchEntryPage';
import { ConsumerLookupPage } from './pages/ConsumerLookupPage';
import { AdminOverviewPage } from './pages/AdminOverviewPage';
import './App.css';

function MainRouter() {
  const { activePage } = useHoneyChain();

  const renderPage = () => {
    switch (activePage) {
      case 'register':
        return <BeekeeperRegistrationPage />;
      case 'batch-entry':
        return <BatchEntryPage />;
      case 'lookup':
        return <ConsumerLookupPage />;
      case 'admin':
        return <AdminOverviewPage />;
      case 'landing':
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {renderPage()}
      </main>
      <Footer />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <HoneyChainProvider>
      <MainRouter />
    </HoneyChainProvider>
  );
}
