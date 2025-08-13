import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './BookingCard.css';
import upIcon from '../assets/up.png';
import downIcon from '../assets/down.png';
import { useDateRange } from '../contexts/DateRangeContext';

const BookingCard = () => {
  const navigate = useNavigate();
  const { checkinDate, checkoutDate, setCheckinDate, setCheckoutDate } = useDateRange();
  const { UID } = useParams();

  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });

  const onCheckAuction = () => {
    if (!checkinDate) return alert('Vui lòng chọn ngày nhận phòng');
    if (!checkoutDate) return alert('Vui lòng chọn ngày trả phòng');

    if (new Date(checkoutDate) <= new Date(checkinDate)) {
      return alert('Ngày trả phòng phải sau ngày nhận phòng');
    }

    const params = new URLSearchParams({
      checkin: checkinDate,            // 'YYYY-MM-DD'
      checkout: checkoutDate
    });

    navigate(`/auction-check/${UID}?${params.toString()}`, {
      state: {
        guests,
        totalGuests
      },
});
  };
  
  
  const updateGuests = (type, operation) => {
    setGuests(prev => {
      const next = { ...prev };
      if (operation === 'increase') next[type] += 1;
      if (operation === 'decrease') next[type] = Math.max(0, next[type] - 1);
      if (type === 'adults') next.adults = Math.max(1, next.adults); // at least 1 adult
      return next;
    });
  };

  const totalGuests = guests.adults + guests.children + guests.infants;
  const guestText = totalGuests === 1 ? '1 khách' : `${totalGuests} khách`;

  // Optional: prevent past dates and enforce checkout >= checkin
  const todayStr = new Date().toISOString().slice(0, 10);
  const minCheckout = checkinDate
    ? new Date(new Date(checkinDate).getTime() + 24*60*60*1000).toISOString().slice(0,10)
    : todayStr;

  return (
    <div className="booking-card">
      <div className="booking-card-content">
        <h3>Đặt phòng</h3>

        <div className="date-inputs">
          <div className="date-input-group">
            <label>Ngày nhận phòng</label>
            <input
              type="date"
              value={checkinDate || ''}
              min={todayStr}
              onChange={(e) => {
                const v = e.target.value;
                setCheckinDate(v);
                // If checkout is before new checkin, clear it
                if (checkoutDate && checkoutDate < v) {
                  setCheckoutDate('');
                }
              }}
              className="date-input"
            />
          </div>

          <div className="date-input-group">
            <label>Ngày trả phòng</label>
            <input
              type="date"
              value={checkoutDate || ''}
              min={minCheckout}
              onChange={(e) => {
                const v = e.target.value;
                if (!checkinDate || new Date(v) > new Date(checkinDate)) {
                  setCheckoutDate(v);
                } else {
                  // ignore or clear if invalid
                  setCheckoutDate('');
                }
              }}
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
            <span>{guestText}</span>
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
                  >-</button>
                  <span>{guests.adults}</span>
                  <button
                    type="button"
                    onClick={() => updateGuests('adults', 'increase')}
                  >+</button>
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
                  >-</button>
                  <span>{guests.children}</span>
                  <button
                    type="button"
                    onClick={() => updateGuests('children', 'increase')}
                  >+</button>
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
                  >-</button>
                  <span>{guests.infants}</span>
                  <button
                    type="button"
                    onClick={() => updateGuests('infants', 'increase')}
                  >+</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button className="auction-button" type="button" onClick={onCheckAuction}>
          Kiểm tra phiên đấu giá
        </button>
      </div>
    </div>
  );
};

export default BookingCard;
