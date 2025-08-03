import React from 'react';
import './Calendar.css';

const Calendar = () => {
  const renderCalendarDays = (days, startOffset) => {
    const dayElements = [];
    for (let i = 0; i < startOffset; i++) {
      dayElements.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    for (let i = 1; i <= days; i++) {
      dayElements.push(<div key={i} className="calendar-day">{i}</div>);
    }
    return dayElements;
  };

  return (
    <div className="calendar-section">
      <h3>Chọn ngày nhận phòng</h3>
      <div className="calendar-container">
        <div className="calendar-month">
          <div className="month-header">
            <button className="nav-button"></button>
            <h4>Tháng 7 năm 2025</h4>
          </div>
          <div className="calendar-grid">
            <div className="day-name">T2</div>
            <div className="day-name">T3</div>
            <div className="day-name">T4</div>
            <div className="day-name">T5</div>
            <div className="day-name">T6</div>
            <div className="day-name">T7</div>
            <div className="day-name">CN</div>
            {renderCalendarDays(31, 1)}
          </div>
        </div>
        <div className="calendar-month">
          <div className="month-header">
            <h4>Tháng 8 năm 2025</h4>
            <button className="nav-button"></button>
          </div>
          <div className="calendar-grid">
            <div className="day-name">T2</div>
            <div className="day-name">T3</div>
            <div className="day-name">T4</div>
            <div className="day-name">T5</div>
            <div className="day-name">T6</div>
            <div className="day-name">T7</div>
            <div className="day-name">CN</div>
            {renderCalendarDays(31, 4)}
          </div>
        </div>
      </div>
      <div className="calendar-footer">
        <button className="clear-dates">Xóa ngày</button>
      </div>
    </div>
  );
};

export default Calendar;