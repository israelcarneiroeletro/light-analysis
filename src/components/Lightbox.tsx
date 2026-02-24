import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
        <motion.img
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          src={imageUrl}
          alt="Full screen view"
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </motion.div>
    </AnimatePresence>
  );
};
