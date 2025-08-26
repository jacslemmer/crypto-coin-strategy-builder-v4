import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Job {
  id: string;
  jobType: string;
  status: string;
  progress: number;
  totalItems: number;
  processedItems: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

interface PairsTriggerProps {
  onPairsFetched?: (count: number) => void;
}

export const PairsTrigger: React.FC<PairsTriggerProps> = ({ onPairsFetched }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [limit, setLimit] = useState(15);

  const fetchPairs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      setCurrentJob(null);

      // Start the pairs fetch job
      const response = await axios.post('/api/v1/pairs/fetch', { limit });
      
      if (data.success) {
        setSuccess(`Successfully fetched ${data.pairsFetched} pairs`);
        onPairsFetched?.(data.pairsFetched);
        
        // Start monitoring the job progress
        monitorJobProgress();
      } else {
        setError(data.error || 'Failed to start pairs fetch');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to fetch pairs: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const monitorJobProgress = async () => {
    try {
      // Get the most recent job
      const jobsResponse = await axios.get('/api/v1/jobs');
      const jobs = data.jobs;
      
      if (jobs.length > 0) {
        const latestJob = jobs[0]; // Jobs are ordered by creation time
        setCurrentJob(latestJob);
        
        // If job is still in progress, start polling
        if (latestJob.status === 'in_progress') {
          pollJobProgress(latestJob.id);
        }
      }
    } catch (err) {
      console.error('Failed to monitor job progress:', err);
    }
  };

  const pollJobProgress = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/v1/jobs/${jobId}`);
        const job = data.job;
        
        setCurrentJob(job);
        
        // Stop polling if job is completed or failed
        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(pollInterval);
          
          if (job.status === 'completed') {
            setSuccess(`Job completed successfully! Fetched ${job.processedItems || 0} pairs`);
          } else if (job.status === 'failed') {
            setError(`Job failed: ${job.error || 'Unknown error'}`);
          }
        }
      } catch (err) {
        console.error('Failed to poll job progress:', err);
        clearInterval(pollInterval);
      }
    }, 1000); // Poll every second
  };

  const getProgressPercentage = () => {
    if (!currentJob) return 0;
    return Math.round((currentJob.progress / 100) * 100);
  };

  const getStatusText = () => {
    if (!currentJob) return '';
    
    switch (currentJob.status) {
      case 'pending':
        return 'Job created, waiting to start...';
      case 'in_progress':
        return `Processing... ${currentJob.progress}% complete`;
      case 'completed':
        return 'Job completed successfully!';
      case 'failed':
        return `Job failed: ${currentJob.error || 'Unknown error'}`;
      default:
        return `Status: ${currentJob.status}`;
    }
  };

  const getStatusColor = () => {
    if (!currentJob) return 'text-gray-500';
    
    switch (currentJob.status) {
      case 'pending':
        return 'text-yellow-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Fetch USDT Trading Pairs
      </h2>
      
      <div className="space-y-6">
        {/* Configuration Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Pairs to Fetch
          </label>
          <select
            id="limit"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value={15}>15 pairs (MVP)</option>
            <option value={50}>50 pairs</option>
            <option value={100}>100 pairs</option>
            <option value={500}>500 pairs</option>
            <option value={1000}>1000 pairs (Full)</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Select the number of top USDT pairs to fetch from CoinMarketCap and CoinGecko APIs.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            onClick={fetchPairs}
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? 'Fetching...' : `Fetch ${limit} Pairs`}
          </button>
        </div>

        {/* Progress Section */}
        {currentJob && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Job Progress</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-blue-700">
                <span>Job ID: {currentJob.id}</span>
                <span className={getStatusColor()}>{getStatusText()}</span>
              </div>
              
              {currentJob.status === 'in_progress' && (
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Started:</span>
                  <span className="ml-2 text-blue-700">
                    {new Date(currentJob.startedAt).toLocaleString()}
                  </span>
                </div>
                {currentJob.completedAt && (
                  <div>
                    <span className="text-blue-600 font-medium">Completed:</span>
                    <span className="ml-2 text-blue-700">
                      {new Date(currentJob.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              
              {currentJob.totalItems && (
                <div className="text-sm text-blue-700">
                  <span className="font-medium">Target:</span> {currentJob.totalItems} pairs
                  {currentJob.processedItems && (
                    <span className="ml-4">
                      <span className="font-medium">Processed:</span> {currentJob.processedItems} pairs
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How it works</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Fetches top USDT pairs by market cap from CoinMarketCap API</li>
            <li>• Falls back to CoinGecko API if CoinMarketCap fails</li>
            <li>• Stores normalized data in the database</li>
            <li>• Tracks job progress in real-time</li>
            <li>• Supports fetching from 15 to 1000 pairs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
