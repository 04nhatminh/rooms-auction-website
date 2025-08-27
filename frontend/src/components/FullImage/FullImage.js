// src/components/Lightbox.jsx
import React, { useEffect } from 'react';
import './FullImage.css';

export default function FullImage({ images, index, onClose, onPrev, onNext }) {
  const hasImages = Array.isArray(images) && images.length > 0;

  const safeIndex = hasImages ? ((index % images.length) + images.length) % images.length : 0;
  const img = hasImages ? images[safeIndex] : null;


  useEffect(() => {
    if (!hasImages) return; 
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') onPrev?.();
      if (e.key === 'ArrowRight') onNext?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hasImages, onClose, onPrev, onNext]);

  if (!hasImages) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true">
      <button className="lb-close" onClick={onClose} aria-label="Close">✕ Close</button>

      <div className="lb-center">
        <button className="lb-nav lb-prev" onClick={onPrev} aria-label="Previous">‹</button>
        <img src={img.src} alt={img.alt} />
        <button className="lb-nav lb-next" onClick={onNext} aria-label="Next">›</button>
      </div>

      <div className="lb-counter">{index + 1} / {images.length}</div>
    </div>
  );
}
