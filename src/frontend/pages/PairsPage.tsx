import React, { useState } from 'react';
import { PairsTrigger } from '../components/PairsTrigger';

interface PairsPageProps {
  onStepComplete?: (step: number) => void;
  onPairsFetched?: (count: number) => void;
}

export const PairsPage: React.FC<PairsPageProps> = ({ onStepComplete, onPairsFetched }) => {
  const [pairsCount, setPairsCount] = useState<number>(0);
  const [stepCompleted, setStepCompleted] = useState<boolean>(false);

  const handlePairsFetched = (count: number) => {
    setPairsCount(count);
    setStepCompleted(true);
    
    if (onPairsFetched) {
      onPairsFetched(count);
    }
  };

  const handleContinueToNextStep = () => {
    if (onStepComplete) {
      onStepComplete(1);
    }
  };

  return (
    <div className="pairs-page">
      <div className="page-header">
        <h1>Step 1: Fetch Trading Pairs</h1>
        <p className="page-description">
          This is the first step in the crypto strategy building process. 
          We need to fetch the top trading pairs from cryptocurrency exchanges 
          to analyze their performance and identify potential opportunities.
        </p>
      </div>

      <div className="page-content">
        <PairsTrigger onPairsFetched={handlePairsFetched} />

        {stepCompleted && (
          <div className="step-completion">
            <div className="completion-card">
              <div className="completion-header">
                <span className="completion-icon">✓</span>
                <h3>Step 1 Complete!</h3>
              </div>
              
              <div className="completion-details">
                <p>
                  Successfully fetched <strong>{pairsCount} trading pairs</strong> from the exchanges.
                </p>
                <p>
                  The data has been normalized and stored in the database. 
                  You can now proceed to the next step where we'll capture 
                  TradingView charts for these pairs.
                </p>
              </div>

              <div className="completion-actions">
                <button 
                  className="btn btn--primary btn--large"
                  onClick={handleContinueToNextStep}
                >
                  Continue to Step 2: Capture Charts
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="page-footer">
        <div className="step-indicator">
          <div className="step step--active">
            <span className="step-number">1</span>
            <span className="step-label">Fetch Pairs</span>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <span className="step-number">2</span>
            <span className="step-label">Capture Charts</span>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <span className="step-number">3</span>
            <span className="step-label">Anonymize</span>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <span className="step-number">4</span>
            <span className="step-label">AI Analysis</span>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <span className="step-number">5</span>
            <span className="step-label">Results</span>
          </div>
        </div>
      </div>
    </div>
  );
};
