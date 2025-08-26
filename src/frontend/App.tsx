import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PairsPage } from './pages/PairsPage';

interface AppState {
  currentStep: number;
  pairsCount: number;
  chartsCount: number;
  analysisCount: number;
}

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    currentStep: 1,
    pairsCount: 0,
    chartsCount: 0,
    analysisCount: 0
  });

  const handleStepComplete = (step: number) => {
    setAppState(prev => ({
      ...prev,
      currentStep: step + 1
    }));
  };

  const handlePairsFetched = (count: number) => {
    setAppState(prev => ({
      ...prev,
      pairsCount: count
    }));
  };

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">Crypto Strategy Builder V4</h1>
            <nav className="app-nav">
              <a href="/" className="nav-link">Home</a>
              <a href="/pairs" className="nav-link">Pairs</a>
              <a href="/charts" className="nav-link">Charts</a>
              <a href="/analysis" className="nav-link">Analysis</a>
              <a href="/results" className="nav-link">Results</a>
            </nav>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route 
              path="/" 
              element={<Navigate to="/pairs" replace />} 
            />
            
            <Route 
              path="/pairs" 
              element={
                <PairsPage 
                  onStepComplete={handleStepComplete}
                  onPairsFetched={handlePairsFetched}
                />
              } 
            />
            
            <Route 
              path="/charts" 
              element={
                <div className="page-placeholder">
                  <h2>Step 2: Capture Charts</h2>
                  <p>This step will be implemented in Story 3.1</p>
                  <p>Current step: {appState.currentStep}</p>
                  <p>Pairs fetched: {appState.pairsCount}</p>
                </div>
              } 
            />
            
            <Route 
              path="/analysis" 
              element={
                <div className="page-placeholder">
                  <h2>Step 4: AI Analysis</h2>
                  <p>This step will be implemented in Story 4.1</p>
                  <p>Current step: {appState.currentStep}</p>
                </div>
              } 
            />
            
            <Route 
              path="/results" 
              element={
                <div className="page-placeholder">
                  <h2>Step 5: Results</h2>
                  <p>This step will be implemented in Story 5.1</p>
                  <p>Current step: {appState.currentStep}</p>
                </div>
              } 
            />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="footer-content">
            <p>&copy; 2024 Crypto Strategy Builder. All rights reserved.</p>
            <div className="footer-links">
              <a href="/docs">Documentation</a>
              <a href="/api">API</a>
              <a href="/support">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};
