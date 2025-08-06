import React, { useState } from 'react';
import './BookingCard.css';
import upIcon from '../assets/up.png';
import downIcon from '../assets/down.png';

const BookingCard = () => {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [guests, setGuests] = useState({
    adults: 1,
    children: 0,
    infants: 0
  });

  const updateGuests = (type, operation) => {
    setGuests(prev => {
      const newGuests = { ...prev };
      if (operation === 'increase') {
        newGuests[type] += 1;
      } else if (operation === 'decrease' && newGuests[type] > 0) {
        newGuests[type] -= 1;
      }
      // Ensure at least 1 adult
      if (type === 'adults' && newGuests[type] < 1) {
        newGuests[type] = 1;
      }
      return newGuests;
    });
  };

  const getTotalGuests = () => {
    return guests.adults + guests.children + guests.infants;
  };

  const formatGuestText = () => {
    const total = getTotalGuests();
    if (total === 1) return '1 khách';
    return `${total} khách`;
  };

  return (
    <div className="booking-card">
      <div className="booking-card-content">
        <h3>Đặt phòng</h3>
        
        <div className="date-inputs">
          <div className="date-input-group">
            <label>Ngày nhận phòng</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="date-input-group">
            <label>Ngày trả phòng</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="date-input"
            />
          </div>
        </div>

        <div className="guest-selector">
          <label>Số lượng khách</label>
          <div 
            className="guest-input"
            onClick={() => setShowGuestDropdown(!showGuestDropdown)}
          >
            <span>{formatGuestText()}</span>
            <img 
              src={showGuestDropdown ? upIcon : downIcon} 
              alt="dropdown arrow" 
              className="dropdown-arrow"
            />
          </div>
          
          {showGuestDropdown && (
            <div className="guest-dropdown">
              <div className="guest-option">
                <div className="guest-info">
                  <span className="guest-type">Người lớn</span>
                  <span className="guest-description">Từ 13 tuổi trở lên</span>
                </div>
                <div className="guest-controls">
                  <button 
                    type="button"
                    onClick={() => updateGuests('adults', 'decrease')}
                    disabled={guests.adults <= 1}
                  >
                    -
                  </button>
                  <span>{guests.adults}</span>
                  <button 
                    type="button"
                    onClick={() => updateGuests('adults', 'increase')}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="guest-option">
                <div className="guest-info">
                  <span className="guest-type">Trẻ em</span>
                  <span className="guest-description">Từ 2-12 tuổi</span>
                </div>
                <div className="guest-controls">
                  <button 
                    type="button"
                    onClick={() => updateGuests('children', 'decrease')}
                    disabled={guests.children <= 0}
                  >
                    -
                  </button>
                  <span>{guests.children}</span>
                  <button 
                    type="button"
                    onClick={() => updateGuests('children', 'increase')}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="guest-option">
                <div className="guest-info">
                  <span className="guest-type">Em bé</span>
                  <span className="guest-description">Dưới 2 tuổi</span>
                </div>
                <div className="guest-controls">
                  <button 
                    type="button"
                    onClick={() => updateGuests('infants', 'decrease')}
                    disabled={guests.infants <= 0}
                  >
                    -
                  </button>
                  <span>{guests.infants}</span>
                  <button 
                    type="button"
                    onClick={() => updateGuests('infants', 'increase')}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button className="auction-button">
          Kiểm tra phiên đấu giá
        </button>
      </div>
    </div>
  );
};

export default BookingCard;
