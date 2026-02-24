import React from 'react';
import { ProcessedImage } from '../types';
import { Check, X, AlertTriangle, Loader2, Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageCardProps {
  image: ProcessedImage;
  onConfirm: (id: string) => void;
  onDeny: (id: string) => void;
  onImageClick: (url: string) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onConfirm,
  onDeny,
  onImageClick,
}) => {
  const isPending = image.validationStatus === 'pending';
  const isConfirmed = image.validationStatus === 'confirmed';
  const isDenied = image.validationStatus === 'denied';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col bg-white dark:bg-zinc-900 rounded-xl shadow-sm border overflow-hidden transition-all duration-200 ${
        isConfirmed
          ? 'border-emerald-500/50 ring-1 ring-emerald-500/50'
          : isDenied
          ? 'border-rose-500/50 ring-1 ring-rose-500/50'
          : 'border-zinc-200 dark:border-zinc-800 hover:shadow-md'
      }`}
    >
      {/* Image Section */}
      <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 group cursor-pointer overflow-hidden">
        <img
          src={image.previewUrl}
          alt={image.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onClick={() => onImageClick(image.previewUrl)}
          referrerPolicy="no-referrer"
        />
        <div
          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none"
        >
          <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={32} />
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2 flex gap-2">
          {image.aiResult ? (
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm backdrop-blur-md ${
                image.aiResult.lightsOn
                  ? 'bg-amber-400/90 text-amber-950'
                  : 'bg-zinc-800/90 text-zinc-100'
              }`}
            >
              AI: {image.aiResult.lightsOn ? 'ON 💡' : 'OFF 🌑'}
            </span>
          ) : image.aiError ? (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm backdrop-blur-md bg-rose-500/90 text-white flex items-center gap-1">
              <AlertTriangle size={12} /> Error
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm backdrop-blur-md bg-blue-500/90 text-white flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Analyzing
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate mb-3" title={image.name}>
          {image.name}
        </h3>

        {image.aiResult ? (
          <div className="flex flex-col gap-2 mb-4 flex-grow">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Confidence</span>
              <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                {(image.aiResult.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-md border border-zinc-100 dark:border-zinc-800">
              <span className="font-medium text-zinc-700 dark:text-zinc-300 block mb-1">Reasoning:</span>
              {image.aiResult.explanation}
            </div>
          </div>
        ) : image.aiError ? (
          <div className="text-xs text-rose-600 dark:text-rose-400 mb-4 flex-grow">
            {image.aiError}
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Waiting for AI analysis...
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => onConfirm(image.id)}
            disabled={!image.aiResult}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              isConfirmed
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            <Check size={16} />
            Confirm
          </button>
          <button
            onClick={() => onDeny(image.id)}
            disabled={!image.aiResult}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              isDenied
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            <X size={16} />
            Override
          </button>
        </div>
      </div>
    </motion.div>
  );
};
