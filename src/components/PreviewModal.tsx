import { useEffect, useCallback } from 'react';
import { WrapPreview } from './WrapPreview';
import './PreviewModal.css';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PreviewModal({ isOpen, onClose }: PreviewModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="preview-modal-close"
          onClick={onClose}
          aria-label="Close preview"
        >
          ×
        </button>
        <div className="preview-modal-body">
          <WrapPreview previewScale={150} />
        </div>
      </div>
    </div>
  );
}
