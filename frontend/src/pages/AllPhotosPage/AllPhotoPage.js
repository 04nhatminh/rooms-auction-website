// AllPhotosPage.jsx
import React, { useMemo, useCallback, useState } from 'react';
import { useLocation, useNavigate  } from 'react-router-dom';
import './AllPhotosPage.css';
import FullImage from '../../components/FullImage/FullImage'

const isUrlLike = v => typeof v === 'string' && (/^https?:\/\//.test(v) || v.startsWith('data:image'));
const pickUrl = (obj) => {
  if (!obj || typeof obj !== 'object') return '';
  const direct = obj.baseUrl || obj.url || obj.image_url || obj.imageUrl || obj.src || '';
  if (isUrlLike(direct)) return direct;
  const nested = obj.urls?.original || obj.urls?.large || obj.urls?.medium || obj.urls?.small;
  if (isUrlLike(nested)) return nested;
  for (const v of Object.values(obj)) if (isUrlLike(v)) return v;
  return '';
};
const pickAlt = (obj, i) => obj?.accessibilityLabel || obj?.alt || `Ảnh ${i + 1}`;

const clean = (s) => (s ?? '')
  .toString()
  .replace(/[\s,"”]+$/g, '') 
  .trim();

const baseLabelFromAlt = (alt) => {
  const s = clean(alt);
  // “Hình ảnh Phòng khách 1” -> “Hình ảnh Phòng khách”
  const m = s.match(/^(?:Hình ảnh|Ảnh)\s+(.+?)(?:\s*\d+)?$/i);
  if (m) return `Hình ảnh ${m[1]}`.trim();
  // Nếu nhãn không có tiền tố “Hình ảnh…”, bỏ số ở cuối nếu có
  return s.replace(/\s*\d+$/,'').trim();
};

const slug = (label) =>
  clean(label)
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u1EF9]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export default function AllPhotosPage() {
    const { state } = useLocation();
    const raw = Array.isArray(state?.images) ? state.images : [];

    const navigate = useNavigate();
    const productPath = state?.productPath || state?.backTo || null;

    const goBack = useCallback(() => {
    if (productPath) navigate(productPath);
    else if (window.history.length > 1) navigate(-1);
    else navigate('/');
    }, [navigate, productPath]);

    const images = useMemo(() => {
        return raw
        .map((it, i) =>
            typeof it === 'string'
            ? { src: it, alt: `Ảnh ${i + 1}` }
            : { src: pickUrl(it), alt: pickAlt(it, i) }
        )
        .filter(x => x.src);
    }, [raw]);

    const sections = useMemo(() => {
        if (!images.length) return [];
        const map = new Map();
        images.forEach((img, i) => {
        const label = baseLabelFromAlt(img.alt) || 'Khác';
        if (!map.has(label)) map.set(label, []);
        map.get(label).push({ ...img, _idx: i });
        });
        return Array.from(map.entries()).map(([label, items]) => ({
        id: `section-${slug(label)}`,
        label,
        items,
        }));
    }, [images]);

    const [lbOpen, setLbOpen] = useState(false);
    const [lbIndex, setLbIndex] = useState(0);
    const openAt = useCallback((i) => { setLbIndex(i); setLbOpen(true); }, []);
    const closeLb = useCallback(() => setLbOpen(false), []);
    const nextLb  = useCallback(() => setLbIndex(i => (i + 1) % images.length), [images.length]);
    const prevLb  = useCallback(() => setLbIndex(i => (i - 1 + images.length) % images.length), [images.length]);

    if (sections.length === 0) {
        return <div style={{ padding: 24 }}>Chưa có ảnh.</div>;
    }

  const top = sections.slice(0, 6);

  return (
    <div className="all-photos">
        <div className="photos-title">
            <button type="button" className="back-btn" onClick={goBack} aria-label="Quay về trang sản phẩm">
                <svg
                  className="back-icon"
                  width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                >
    <path d="M15 18l-6-6 6-6" />
  </svg>
            </button>
            <h2>Tham quan qua ảnh</h2>
        </div>
        
      <div className="thumb-nav">
        {top.map((sec) => (
           <a
            key={sec.id}
            href={`#${sec.id}`}
            className="thumb-card"
            onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(sec.id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            >
            <img src={sec.items[0].src} alt={sec.label} loading="lazy" />
            <div className="thumb-label">
              {sec.label.replace(/^Hình ảnh\s+/i, '')}
            </div>
          </a>
        ))}
      </div>
      {sections.map(sec => (
        <section key={sec.id} id={sec.id} className="photo-section">
          <h3 className="section-title">{sec.label.replace(/^(Hình ảnh|Ảnh)\s+/i, '')}</h3>
          <div className="section-grid">
            {sec.items.map((img, idx) => (
              <figure
                key={`${sec.id}-${img._idx}-${idx}`}
                className="photo-item"
                onClick={() => openAt(img._idx)}
                role="button" tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openAt(img._idx)}
              >
                <img src={img.src} alt={img.alt} loading="lazy" />
              </figure>
            ))}
          </div>
        </section>
      ))}

      {lbOpen && (
        <FullImage
          images={images}
          index={lbIndex}
          onClose={closeLb}
          onPrev={prevLb}
          onNext={nextLb}
        />
      )}
    </div>
  );
}
