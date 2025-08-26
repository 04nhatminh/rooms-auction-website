import React, { useState } from 'react';
import './Calendar.css';
import { useDateRange } from '../../contexts/DateRangeContext';
import chevronLeftGrayIcon from '../../assets/chevron_left_gray.png';
import chevronRightGrayIcon from '../../assets/chevron_right_gray.png';
import chevronLeftBlackIcon from '../../assets/chevron_left_black.png';
import chevronRightBlackIcon from '../../assets/chevron_right_black.png';

const pad = (n) => String(n).padStart(2, '0');
const ymdLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmdLocal = (s) => {
  const [y, m, dd] = s.split('-').map(Number);
  return new Date(y, m - 1, dd); // local date
};

const Calendar = () => {
  const { checkinDate, checkoutDate, setRange } = useDateRange();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ==== Mốc tháng hiện tại (đầu tháng) ====
  const THIS_YEAR = today.getFullYear();
  const CUR_MONTH = today.getMonth(); // 0..11
  const CURRENT_MONTH_START = new Date(THIS_YEAR, CUR_MONTH, 1);

  // base month (left panel)
  const [base, setBase] = useState(new Date(THIS_YEAR, CUR_MONTH, 1));
  const left  = new Date(base.getFullYear(), base.getMonth(), 1);
  const right = new Date(base.getFullYear(), base.getMonth() + 1, 1);


  // Chỉ chặn lùi nếu base đã là tháng hiện tại (không được lùi thêm về trước)
  const allowPrev = left.getTime() > CURRENT_MONTH_START.getTime();
  const allowNext = true; // luôn cho đi tới (có thể sang năm sau)

  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
  const startOffset = (y, m) => (new Date(y, m, 1).getDay() + 6) % 7; // Mon-first

  const goPrev = () => {
    if (!allowPrev) return;
    setBase(new Date(base.getFullYear(), base.getMonth() - 1, 1));
  };

  const goNext = () => {
    setBase(new Date(base.getFullYear(), base.getMonth() + 1, 1));
  };

  const isSelected = (dateObj) => {
    const d = ymdLocal(dateObj);
    return d === checkinDate || d === checkoutDate;
  };

  const inRange = (dateObj) => {
    if (!checkinDate || !checkoutDate) return false;
    const t    = new Date(dateObj).setHours(0, 0, 0, 0);
    const inT  = new Date(checkinDate).setHours(0, 0, 0, 0);
    const outT = new Date(checkoutDate).setHours(0, 0, 0, 0);
    return t > inT && t <= outT;
  };

  const selectDate = (dateObj) => {
    const d = ymdLocal(dateObj);
    if (!checkinDate || (checkinDate && checkoutDate)) {
      setRange({ checkin: d, checkout: '' });
    } else {
      const inD  = new Date(checkinDate);
      const outD = new Date(d);
      if (outD > inD) setRange({ checkout: d });
      else            setRange({ checkin: d, checkout: '' });
    }
  };

  const renderMonth = (d, showPrevBtn, showNextBtn) => {
    const y = d.getFullYear(), m = d.getMonth();
    const totalDays = daysIn(y, m);
    const offset = startOffset(y, m);

    return (
      <div className="calendar-month">
        <div className="month-header">
          {showPrevBtn ? (
            <button className="nav-button" onClick={goPrev} disabled={!allowPrev}>
              <img
                src={allowPrev ? chevronLeftBlackIcon : chevronLeftGrayIcon}
                alt=""
                className="chevron-icon"
              />
            </button>
          ) : (
            <button
              className="nav-button"
              style={{ visibility: 'hidden' }}
              aria-hidden="true"
              tabIndex={-1}
            />
          )}

          <h4>Tháng {m + 1} năm {y}</h4>

          {showNextBtn ? (
            <button className="nav-button" onClick={goNext} disabled={!allowNext}>
              <img
                src={allowNext ? chevronRightBlackIcon : chevronRightGrayIcon}
                alt=""
                className="chevron-icon"
              />
            </button>
          ) : (
            <button
              className="nav-button"
              style={{ visibility: 'hidden' }}
              aria-hidden="true"
              tabIndex={-1}
            />
          )}
        </div>

        <div className="calendar-grid">
          {['T2','T3','T4','T5','T6','T7','CN'].map(dn => (
            <div key={dn} className="day-name">{dn}</div>
          ))}

          {Array.from({ length: offset }).map((_, i) => (
            <div key={`e${i}`} className="calendar-day empty" />
          ))}

          {Array.from({ length: totalDays }).map((_, i) => {
            const dateObj = new Date(y, m, i + 1);
            dateObj.setHours(0, 0, 0, 0);
            const isPast = dateObj < today;

            return (
              <div
                key={i}
                className={[
                  'calendar-day',
                  isPast && 'past-date',
                  isSelected(dateObj) && 'selected',
                  inRange(dateObj) && 'in-range',
                ].filter(Boolean).join(' ')}
                onClick={() => !isPast && selectDate(dateObj)}
                role="button"
                aria-disabled={isPast}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const title = !checkinDate || (checkinDate && checkoutDate)
    ? 'Chọn ngày nhận phòng'
    : 'Chọn ngày trả phòng';

  return (
    <div className="calendar-section">
      <h3>{title}</h3>
      <div className="calendar-container">
        {/* Pane trái luôn hiển thị */}
        {renderMonth(left, true, false)}
        {/* Pane phải luôn hiển thị (không giới hạn tới tháng 12) */}
        {renderMonth(right, false, true)}
      </div>
      <div className="calendar-footer">
        <button
          className="clear-dates"
          type="button"
          onClick={() => setRange({ checkin: '', checkout: '' })}
        >
          Xóa ngày
        </button>
      </div>
    </div>
  );
};

export default Calendar;
