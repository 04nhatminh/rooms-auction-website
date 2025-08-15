import React, { useState } from 'react';
import './Calendar.css';
import { useDateRange } from '../../contexts/DateRangeContext';
import chevronLeftGrayIcon from '../../assets/chevron_left_gray.png';
import chevronRightGrayIcon from '../../assets/chevron_right_gray.png';
import chevronLeftBlackIcon from '../../assets/chevron_left_black.png';
import chevronRightBlackIcon from '../../assets/chevron_right_black.png';

const Calendar = () => {
  const { checkinDate, checkoutDate, setRange } = useDateRange();

  // zeroed "today"
  const today = new Date();
  today.setHours(0,0,0,0);

  // base month (left panel)
  const [base, setBase] = useState(new Date());
  const left  = new Date(base.getFullYear(), base.getMonth(), 1);
  const right = new Date(base.getFullYear(), base.getMonth() + 1, 1);

  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
  const startOffset = (y, m) => (new Date(y, m, 1).getDay() + 6) % 7; // Mon-first

  const goPrev = () => setBase(new Date(base.getFullYear(), base.getMonth() - 1, 1));
  const goNext = () => setBase(new Date(base.getFullYear(), base.getMonth() + 1, 1));

  const isSelected = (dateObj) => {
    const d = dateObj.toISOString().slice(0,10);
    return d === checkinDate || d === checkoutDate;
  };

  const inRange = (dateObj) => {
    if (!checkinDate || !checkoutDate) return false;
    const t   = new Date(dateObj).setHours(0,0,0,0);
    const inT  = new Date(checkinDate).setHours(0,0,0,0);
    const outT = new Date(checkoutDate).setHours(0,0,0,0);
    return t > inT && t <= outT;
  };

  const selectDate = (dateObj) => {
    const d = dateObj.toISOString().slice(0,10); // 'YYYY-MM-DD'
    if (!checkinDate || (checkinDate && checkoutDate)) {
      // start a new range
      setRange({ checkin: d, checkout: '' });
    } else {
      // finish the range — must be AFTER check-in
      const inD  = new Date(checkinDate);
      const outD = new Date(d);
      if (outD > inD) setRange({ checkout: d });
      else            setRange({ checkin: d, checkout: '' }); // reset if invalid
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
            <button className="nav-button" onClick={goPrev}>
              <img src={chevronLeftBlackIcon} alt="" className="chevron-icon"/>
            </button>
          ) : (
            <button className="nav-button" disabled>
              <img src={chevronLeftGrayIcon} alt="" className="chevron-icon"/>
            </button>
          )}

          <h4>Tháng {m + 1} năm {y}</h4>

          {showNextBtn ? (
            <button className="nav-button" onClick={goNext}>
              <img src={chevronRightBlackIcon} alt="" className="chevron-icon"/>
            </button>
          ) : (
            <button className="nav-button" disabled>
              <img src={chevronRightGrayIcon} alt="" className="chevron-icon"/>
            </button>
          )}
        </div>

        <div className="calendar-grid">
          {['T2','T3','T4','T5','T6','T7','CN'].map(dn => (
            <div key={dn} className="day-name">{dn}</div>
          ))}

          {Array.from({length: offset}).map((_, i) => (
            <div key={`e${i}`} className="calendar-day empty" />
          ))}

          {Array.from({length: totalDays}).map((_, i) => {
            const dateObj = new Date(y, m, i + 1);
            dateObj.setHours(0,0,0,0);
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
                {i}
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
        {renderMonth(left, true, false)}
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
