import React from 'react';
import './Calendar.css';
import chevronLeftGrayIcon from '../assets/chevron_left_gray.png';
import chevronRightGrayIcon from '../assets/chevron_right_gray.png';
import chevronLeftBlackIcon from '../assets/chevron_left_black.png';
import chevronRightBlackIcon from '../assets/chevron_right_black.png';

const Calendar = () => {
  // Lấy ngày, tháng, năm hiện tại
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // Tháng đang hiển thị
  const leftMonthNumber = 8; // Tháng 8
  const rightMonthNumber = 9; // Tháng 9
  
  // Kiểm tra có thể navigate không
  const canGoBack = leftMonthNumber > currentMonth || currentYear < 2025;
  const canGoForward = true; // Luôn có thể đi tới tháng sau
  
  const renderCalendarDays = (days, startOffset, monthNumber) => {
    const dayElements = [];
    for (let i = 0; i < startOffset; i++) {
      dayElements.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    for (let i = 1; i <= days; i++) {
      // Kiểm tra xem ngày này có nhỏ hơn ngày hiện tại không
      const isPastDate = (monthNumber < currentMonth && currentYear === 2025) || 
                        (monthNumber === currentMonth && i < currentDay && currentYear === 2025) ||
                        (currentYear > 2025);
      
      dayElements.push(
        <div 
          key={i} 
          className={`calendar-day ${isPastDate ? 'past-date' : ''}`}
        >
          {i}
        </div>
      );
    }
    return dayElements;
  };

  return (
    <div className="calendar-section">
      <h3>Chọn ngày nhận phòng</h3>
      <div className="calendar-container">
        <div className="calendar-month">
          <div className="month-header">
            <button className="nav-button" disabled={!canGoBack}>
              <img 
                src={canGoBack ? chevronLeftBlackIcon : chevronLeftGrayIcon} 
                alt="Previous month" 
                className="chevron-icon"
              />
            </button>
            <h4>Tháng 8 năm 2025</h4>
          </div>
          <div className="calendar-grid">
            <div className="day-name">T2</div>
            <div className="day-name">T3</div>
            <div className="day-name">T4</div>
            <div className="day-name">T5</div>
            <div className="day-name">T6</div>
            <div className="day-name">T7</div>
            <div className="day-name">CN</div>
            {renderCalendarDays(31, 4, leftMonthNumber)}
          </div>
        </div>
        <div className="calendar-month">
          <div className="month-header">
            <h4>Tháng 9 năm 2025</h4>
            <button className="nav-button" disabled={!canGoForward}>
              <img 
                src={canGoForward ? chevronRightBlackIcon : chevronRightGrayIcon} 
                alt="Next month" 
                className="chevron-icon"
              />
            </button>
          </div>
          <div className="calendar-grid">
            <div className="day-name">T2</div>
            <div className="day-name">T3</div>
            <div className="day-name">T4</div>
            <div className="day-name">T5</div>
            <div className="day-name">T6</div>
            <div className="day-name">T7</div>
            <div className="day-name">CN</div>
            {renderCalendarDays(30, 0, rightMonthNumber)}
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