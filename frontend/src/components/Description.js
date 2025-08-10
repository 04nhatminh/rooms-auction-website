import React, { useMemo, useState } from 'react';
import './Description.css';
import { useProduct } from '../contexts/ProductContext';
import DOMPurify from 'dompurify';


const Description = () => {
  const { data } = useProduct();
  const [expanded, setExpanded] = useState(false);

  const sections = useMemo(() => {
    const raw = data?.description || [];
    return raw.map((item) => {
      if (typeof item === 'string') {
        return { title: null, htmlText: item };
      }
      return {
        title: item?.title ?? null,
        htmlText: item?.htmlText ?? '',
      };
    });
  }, [data]);

  const VISIBLE_COUNT = 2;
  const visible = expanded ? sections : sections.slice(0, VISIBLE_COUNT);

  if (!sections.length) return null;

  // return (
    
  //   <div className="description">
  //     <h3>Giới thiệu về chỗ ở này</h3>
  //     <p>Chúng tôi cung cấp không gian sống sang trọng, ấm áp, đầy đủ tiện nghi như ở nhà với những vật dụng sản phẩm thân thiện, bảo vệ môi trường. Ban công rộng, khung cảnh ấn tượng với view nhìn thấy thành phố, 2 núi và cả 3 khu vực biển: bãi sau, bãi trước, bãi dâu. Các tiện ích miễn phí trong tòa nhà vô cùng đầy đủ và hấp dẫn: hồ bơi trên cao, hồ bơi cho gia đình và trẻ em, khu vực BBQ, phòng đa năng làm việc đọc sách, bóng bàn, bàn đá bóng mini, karaoke, phòng trò chơi cho trẻ em.</p>
  //     <h2>Chỗ ở</h2>
  //     <p>Căn hộ thuộc tòa nhà An gia (The Sóng) được mệnh danh là tòa nhà 5* đang hot nhất Vũng Tàu.Căn hộ có 1 phòng ngủ với giường king-size, rộng rãi đủ trải thêm nệm 1m4 và có cả khu vực chill uống trà, đọc sách, ngắm cảnh; phòng khách có sofa bed và có phòng bếp đầy đủ tiện nghi, đảm bảo drap, mền, khăn được thay và vệ sinh sạch sẽ sau mỗi đợt khách.</p>
  //     <button>Hiển thị thêm</button>
  //   </div>
  // );

  return (
    <div className="description">
      {visible.map((sec, idx) => (
        <div key={idx} className="mb-3">
          {sec.title && <h3>{sec.title}</h3>}
          {/* Nếu htmlText là HTML, dùng dangerouslySetInnerHTML (khuyên dùng DOMPurify để lọc) */}
          {/* const safeHTML = DOMPurify.sanitize(sec.htmlText); */}
          {/* <div dangerouslySetInnerHTML={{ __html: safeHTML }} /> */}
          <p dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(sec.htmlText || '')}}></p>
        </div>
      ))}

      {sections.length > VISIBLE_COUNT && (
        <button type="button" onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Thu gọn' : 'Hiển thị thêm'}
        </button>
      )}
    </div>
  );
};

export default Description;