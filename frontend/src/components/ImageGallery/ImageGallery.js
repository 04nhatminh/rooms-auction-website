// import React from 'react';
// import './ImageGallery.css';
// import dotsMenuIcon from '../assets/dots_menu.png';

// const ImageGallery = () => {
//   return (
//     <div className="image-gallery">
//       <div className="gallery-layout">
//         <div className="main-image"></div>
//         <div className="side-images">
//           <div className="side-image"></div>
//           <div className="side-image"></div>
//           <div className="side-image"></div>
//           <div className="side-image"></div>
//         </div>
//       </div>
//       <button className="show-all-photos">
//         <img src={dotsMenuIcon} alt="Hiển thị tất cả ảnh" />
//         Hiển thị tất cả ảnh
//       </button>
//     </div>
//   );
// };

// export default ImageGallery;

import React, { useMemo } from 'react';
import './ImageGallery.css';
import dotsMenuIcon from '../../assets/dots_menu.png';
import { useProduct } from '../../contexts/ProductContext';

function isUrlLike(v) {
  return typeof v === 'string' && (/^https?:\/\//.test(v) || v.startsWith('data:image'));
}

function pickUrl(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const direct =
    obj.baseUrl ||      // << your schema
    obj.url ||
    obj.image_url ||
    obj.imageUrl ||
    obj.picture_url ||
    obj.pictureUrl ||
    obj.thumbnail_url ||
    obj.src ||
    obj.path || '';
  if (isUrlLike(direct)) return direct;

  const nested = obj.urls?.original || obj.urls?.large || obj.urls?.medium || obj.urls?.small;
  if (isUrlLike(nested)) return nested;

  for (const v of Object.values(obj)) {
    if (isUrlLike(v)) return v;
  }
  return '';
}

function pickAlt(obj, idx) {
  return obj?.accessibilityLabel || obj?.alt || `Ảnh ${idx + 1}`;
}

const ImageGallery = ({ images: imagesProp }) => {
  // const { data } = useProduct();
  const ctx = useProduct?.() ?? null;
  const data = ctx?.data;

  const raw = imagesProp ?? data?.images ?? data?.Images ?? [];

  // Support both "images" and "Images"
  // const rawFromCtx = data?.images ?? data?.Images ?? [];
  // const raw = imagesProp ?? rawFromCtx;

  const images = useMemo(() => {
    return raw
      .map((it, i) => {
        if (typeof it === "string") return { src: it, alt: `Ảnh ${i + 1}` };
        const src = pickUrl(it);
        const alt = pickAlt(it, i);
        return src ? { src, alt } : null;
      })
      .filter(Boolean);
  }, [raw]);

  if (!images.length) {
    return (
      <div className="image-gallery empty">
        <div className="placeholder">Chưa có ảnh</div>
      </div>
    );
  }

  const main = images[0];
  const side = images.slice(1, 5);

  if (!images.length) {
    return (
      <div className="image-gallery empty">
        <div className="placeholder">Chưa có ảnh</div>
      </div>
    );
  }

  return (
    <div className="image-gallery">
      <div className="gallery-layout">
        <div className="main-image">
          <img src={main.src} alt={main.alt} />
        </div>
        <div className="side-images">
          {side.map((img, i) => (
            <div className="side-image" key={i}>
              <img src={img.src} alt={img.alt} />
            </div>
          ))}
        </div>
      </div>

      <button className="show-all-photos" type="button">
        <img className="button-icon" src={dotsMenuIcon} alt="" />
        Hiển thị tất cả ảnh
      </button>
    </div>
  );
};

export default ImageGallery;

