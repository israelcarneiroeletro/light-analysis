import React, { useState, useEffect, useCallback } from 'react';
import { GasApiService } from './services/api';
import { analyzeImage } from './services/gemini';
import { ProcessedImage, GasBatchResponse } from './types';
import { ImageCard } from './components/ImageCard';
import { Lightbox } from './components/Lightbox';
import { exportToExcel } from './utils/export';
import { Download, RefreshCw, Play, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [gasApiUrl, setGasApiUrl] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [runHistory, setRunHistory] = useState<ProcessedImage[]>([]);
  const [currentBatch, setCurrentBatch] = useState<ProcessedImage[]>([]);
  const [batchInfo, setBatchInfo] = useState<GasBatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Initialize GAS API Service
  const gasApi = React.useMemo(() => new GasApiService(gasApiUrl), [gasApiUrl]);

  const showMessage = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleInitQueue = async () => {
    if (!gasApiUrl) return showMessage('Please configure the GAS API URL first.', 'error');
    setIsLoading(true);
    try {
      await gasApi.initQueue();
      showMessage('Queue initialized successfully.', 'success');
      setCurrentBatch([]);
      setBatchInfo(null);
    } catch (error) {
      showMessage('Failed to initialize queue.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchNextBatch = async () => {
    if (!gasApiUrl) return showMessage('Please configure the GAS API URL first.', 'error');
    setIsLoading(true);
    try {
      const data = await gasApi.fetchNextBatch();
      if (!data) {
        showMessage('No more batches available.', 'info');
        setCurrentBatch([]);
        setBatchInfo(null);
        return;
      }

      setBatchInfo(data);
      
      // Prepare images for processing
      const newImages: ProcessedImage[] = data.images.map((img) => ({
        ...img,
        folderName: data.folderName,
        aiResult: null,
        humanOverride: null,
        finalStatus: null,
        validationStatus: 'pending',
      }));

      setCurrentBatch(newImages);
      
      // Add to run history immediately so we track them even before AI finishes
      setRunHistory((prev) => [...prev, ...newImages]);

      // Trigger AI analysis for each image
      processImagesWithAI(newImages);

    } catch (error) {
      showMessage('Failed to fetch next batch.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const processImagesWithAI = async (images: ProcessedImage[]) => {
    for (const img of images) {
      try {
        const result = await analyzeImage(img.directDownloadUrl);
        
        // Update current batch
        setCurrentBatch((prev) =>
          prev.map((pImg) =>
            pImg.id === img.id
              ? { ...pImg, aiResult: result, finalStatus: result.lightsOn }
              : pImg
          )
        );

        // Update run history
        setRunHistory((prev) =>
          prev.map((pImg) =>
            pImg.id === img.id
              ? { ...pImg, aiResult: result, finalStatus: result.lightsOn }
              : pImg
          )
        );
      } catch (error: any) {
        console.error(`AI Analysis failed for ${img.name}:`, error);
        
        const errorMsg = error.message || 'AI analysis failed';
        
        setCurrentBatch((prev) =>
          prev.map((pImg) =>
            pImg.id === img.id ? { ...pImg, aiError: errorMsg } : pImg
          )
        );
        setRunHistory((prev) =>
          prev.map((pImg) =>
            pImg.id === img.id ? { ...pImg, aiError: errorMsg } : pImg
          )
        );
      }
    }
  };

  const handleResetQueue = async () => {
    if (!gasApiUrl) return showMessage('Please configure the GAS API URL first.', 'error');
    if (!window.confirm('Are you sure you want to reset the queue? This will not clear your local run history.')) return;
    
    setIsLoading(true);
    try {
      await gasApi.resetQueue();
      showMessage('Queue reset successfully.', 'success');
      setCurrentBatch([]);
      setBatchInfo(null);
    } catch (error) {
      showMessage('Failed to reset queue.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = useCallback((id: string) => {
    setCurrentBatch((prev) =>
      prev.map((img) => {
        if (img.id === id && img.aiResult) {
          return {
            ...img,
            validationStatus: 'confirmed',
            humanOverride: null,
            finalStatus: img.aiResult.lightsOn,
          };
        }
        return img;
      })
    );

    setRunHistory((prev) =>
      prev.map((img) => {
        if (img.id === id && img.aiResult) {
          return {
            ...img,
            validationStatus: 'confirmed',
            humanOverride: null,
            finalStatus: img.aiResult.lightsOn,
          };
        }
        return img;
      })
    );
  }, []);

  const handleDeny = useCallback((id: string) => {
    setCurrentBatch((prev) =>
      prev.map((img) => {
        if (img.id === id && img.aiResult) {
          const overriddenStatus = !img.aiResult.lightsOn;
          return {
            ...img,
            validationStatus: 'denied',
            humanOverride: overriddenStatus,
            finalStatus: overriddenStatus,
          };
        }
        return img;
      })
    );

    setRunHistory((prev) =>
      prev.map((img) => {
        if (img.id === id && img.aiResult) {
          const overriddenStatus = !img.aiResult.lightsOn;
          return {
            ...img,
            validationStatus: 'denied',
            humanOverride: overriddenStatus,
            finalStatus: overriddenStatus,
          };
        }
        return img;
      })
    );
  }, []);

  const handleExport = () => {
    if (runHistory.length === 0) {
      showMessage('No data to export.', 'info');
      return;
    }
    exportToExcel(runHistory);
    showMessage('Export completed successfully.', 'success');
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-900 dark:text-zinc-100">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl mb-6 mx-auto">
            <Settings size={24} />
          </div>
          <h1 className="text-2xl font-semibold text-center mb-2">System Configuration</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm mb-8">
            Enter the Google Apps Script (GAS) API endpoint to connect to the image queue.
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="gasUrl" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                GAS API URL
              </label>
              <input
                id="gasUrl"
                type="url"
                value={gasApiUrl}
                onChange={(e) => setGasApiUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>
            <button
              onClick={() => {
                if (gasApiUrl.trim()) setIsConfigured(true);
              }}
              disabled={!gasApiUrl.trim()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Connect System <Play size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const pendingCount = currentBatch.filter(img => img.validationStatus === 'pending').length;
  const processedCount = runHistory.length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <CheckCircle2 size={20} />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">Bus Shelter Light Validator</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mr-4">
              <span>Total Processed: <strong className="text-zinc-900 dark:text-zinc-100">{processedCount}</strong></span>
              {currentBatch.length > 0 && (
                <span>Pending in Batch: <strong className="text-zinc-900 dark:text-zinc-100">{pendingCount}</strong></span>
              )}
            </div>
            <button
              onClick={handleExport}
              disabled={runHistory.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export Report</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                statusMessage.type === 'error' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30' :
                statusMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30' :
                'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30'
              }`}
            >
              {statusMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              {statusMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Controls */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Queue Controls</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {batchInfo 
                  ? `Current Folder: ${batchInfo.folderName} (Batch ${batchInfo.batchIndex} of ${batchInfo.totalBatches})`
                  : 'No active batch. Initialize or fetch next.'}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleInitQueue}
                disabled={isLoading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                Init Queue
              </button>
              <button
                onClick={handleFetchNextBatch}
                disabled={isLoading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
              >
                <Play size={16} />
                Fetch Next Batch
              </button>
              <button
                onClick={handleResetQueue}
                disabled={isLoading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Reset System
              </button>
            </div>
          </div>
        </div>

        {/* Image Grid */}
        {currentBatch.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentBatch.map((img) => (
              <ImageCard
                key={img.id}
                image={img}
                onConfirm={handleConfirm}
                onDeny={handleDeny}
                onImageClick={setLightboxImage}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 dark:text-zinc-400 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
            <div className="w-16 h-16 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Play size={24} className="text-zinc-400 dark:text-zinc-500 ml-1" />
            </div>
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No images loaded</p>
            <p className="text-sm mt-1">Click "Fetch Next Batch" to start validating.</p>
          </div>
        )}
      </main>

      {/* Lightbox */}
      <Lightbox
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
