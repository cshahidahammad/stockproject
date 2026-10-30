import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DatasetProvider } from './context/DatasetContext';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { StockAnalysisPage } from './pages/StockAnalysisPage';
import { TrendPredictionPage } from './pages/TrendPredictionPage';
import { ChartsPage } from './pages/ChartsPage';
import { DataUploadPage } from './pages/DataUploadPage';
import { AboutProjectPage } from './pages/AboutProjectPage';

const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Financial Analytics Dashboard',
    subtitle: 'Real-time dataset overview, closing prices & key indicator summary',
  },
  analysis: {
    title: 'Stock Indicator Analysis',
    subtitle: 'Historical pricing, technical indicators, and distribution statistics',
  },
  prediction: {
    title: 'Machine-Learning Trend Prediction',
    subtitle: 'Logistic Regression next-observation direction classifier (80/20 split)',
  },
  charts: {
    title: 'Interactive Chart Explorer',
    subtitle: 'Multi-indicator time-series charts with customizable date filtering',
  },
  upload: {
    title: 'Dataset Ingestion & Management',
    subtitle: 'Upload and validate custom historical CSV files with complete session isolation',
  },
  about: {
    title: 'Project Documentation & Viva Q&A',
    subtitle: 'Architecture, ML methodology, limitations, and defense preparation',
  },
};

const MainLayout: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const currentInfo = pageTitles[activePage];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex">
      {/* Sidebar navigation */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          title={currentInfo.title}
          subtitle={currentInfo.subtitle}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              onNavigateToCharts={() => setActivePage('charts')}
              onNavigateToPredict={() => setActivePage('prediction')}
            />
          )}
          {activePage === 'analysis' && <StockAnalysisPage />}
          {activePage === 'prediction' && <TrendPredictionPage />}
          {activePage === 'charts' && <ChartsPage />}
          {activePage === 'upload' && (
            <DataUploadPage onNavigateToDashboard={() => setActivePage('dashboard')} />
          )}
          {activePage === 'about' && <AboutProjectPage />}
        </main>

        <footer className="py-4 px-6 border-t border-slate-800/80 text-center text-xs font-mono text-slate-400">
          Stock Market Trend Analysis • Full-Stack Web Application • Academic Data Science Suite
        </footer>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center font-mono text-slate-300">
        <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4" />
        <p className="text-sm tracking-wide text-slate-400">Verifying terminal credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authMode === 'signup') {
      return <SignUpPage onNavigateToLogin={() => setAuthMode('login')} />;
    }
    return <LoginPage onNavigateToSignUp={() => setAuthMode('signup')} />;
  }

  return (
    <DatasetProvider>
      <MainLayout />
    </DatasetProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
