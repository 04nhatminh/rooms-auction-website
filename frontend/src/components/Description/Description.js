import React, { useMemo, useState } from 'react';
import './Description.css';
import { useProduct } from '../../contexts/ProductContext';
import DOMPurify from 'dompurify';

const Description = () => {
  const { data } = useProduct();
  const [expanded, setExpanded] = useState(false);

  const sections = useMemo(() => {
    const raw = data?.description || [];
    return raw.map((item) => {
      let title = null;
      let htmlText = '';

      if (typeof item === 'string') {
        htmlText = item;
      } else {
        title = item?.title ?? null;
        htmlText = item?.htmlText ?? '';
      }

      // Tách chuỗi HTML theo <br> hoặc <br/> hoặc <br />
      const listItems = htmlText
        .split(/<br\s*\/?>/i) // tách theo thẻ br
        .map(str => str.trim()) // bỏ khoảng trắng thừa
        .filter(str => str.length > 0); // bỏ dòng trống

      return { title, listItems };
    });
  }, [data]);

  const VISIBLE_COUNT = 1;
  const visible = expanded ? sections : sections.slice(0, VISIBLE_COUNT);

  if (!sections.length) return null;

  return (
    <div className="description">
      <h3>Giới thiệu về chỗ ở này</h3>
      {visible.map((sec, idx) => (
        <div key={idx} className="description-content">
          {sec.title && <h4>{sec.title}</h4>}
          {sec.listItems && sec.listItems.length > 0 ? (
            <ul>
              {sec.listItems.map((line, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(line) }} />
              ))}
            </ul>
          ) : null}
        </div>
      ))}

      {sections.length > VISIBLE_COUNT && (
        <button type="button" onClick={() => setExpanded(v => !v)}>
          {expanded ? 'Thu gọn' : 'Hiển thị thêm'}
        </button>
      )}
    </div>
  );
};

export default Description;
