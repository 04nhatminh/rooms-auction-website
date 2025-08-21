// src/components/BookingCard/BookingCard.js
import React, { useState, useContext, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './BookingCard.css';
import upIcon from '../../assets/up.png';
import downIcon from '../../assets/down.png';
import { useDateRange } from '../../contexts/DateRangeContext';
import { ProductContext } from '../../contexts/ProductContext';
import productApi from '../../api/productApi';

const BookingCard = () => {
  const navigate = useNavigate();
  const { UID } = useParams();
  const { data } = useContext(ProductContext); // data đã được load ở RoomDetailPage
  const { checkinDate, checkoutDate, setCheckinDate, setCheckoutDate } = useDateRange();

  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });

  // >>> MaxGuests nằm ở data.details.MaxGuests (ép kiểu & fallback 4)
  const maxGuests = useMemo(() => {
    const raw = data?.details?.MaxGuests;
    const n = typeof raw === 'string' ? parseInt(raw, 10) : raw;
    return Number.isFinite(n) && n > 0 ? n : 4;
  }, [data]);

  // infants KHÔNG tính vào giới hạn (theo Airbnb)
  const eligibleCount = guests.adults + guests.children;
  const totalGuests = eligibleCount + guests.infants;
  const reachedLimit = eligibleCount >= maxGuests;

  const guestText = totalGuests === 1 ? '1 khách' : `${totalGuests} khách`;

  const todayStr = new Date().toISOString().slice(0, 10);
  const minCheckout = checkinDate
    ? new Date(new Date(checkinDate).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : todayStr;

  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(null); // { level: 'ok'|'warn'|'error', message: string }

  const buildQuery = () =>
    new URLSearchParams({ checkin: checkinDate, checkout: checkoutDate }).toString();

  const updateGuests = (type, operation) => {
    setGuests(prev => {
      const next = { ...prev };

      if (operation === 'increase') {
        if (type === 'infants') {
          next.infants += 1; // infants không tính limit
        } else {
          const nextEligible = (prev.adults + prev.children) + 1;
          if (nextEligible <= maxGuests) next[type] += 1;
        }
      } else if (operation === 'decrease') {
        if (type === 'adults') next.adults = Math.max(1, next.adults - 1); // ít nhất 1 adult
        if (type === 'children') next.children = Math.max(0, next.children - 1);
        if (type === 'infants') next.infants = Math.max(0, next.infants - 1);
      }
      return next;
    });
  };

  const onCheckAvailability = async () => {
    if (!checkinDate) return alert('Vui lòng chọn ngày nhận phòng');
    if (!checkoutDate) return alert('Vui lòng chọn ngày trả phòng');
    if (new Date(checkoutDate) <= new Date(checkinDate)) {
      return alert('Ngày trả phòng phải sau ngày nhận phòng');
    }

    try {
      setChecking(true);
      setStatus(null);

      const data = await productApi.checkAvailability(UID, {
        checkin: checkinDate,
        checkout: checkoutDate,
      });
  
      let level = 'warn';
      let message = 'Không xác định được tình trạng phòng.';

      if (typeof data.available === 'boolean') {
        if (data.available) {
          level = 'ok';
          message = 'Phòng TRỐNG toàn bộ khoảng thời gian đã chọn.';
        } else {
          level = (data.reason === 'booked' || data.reason === 'blocked') ? 'error' : 'warn';
          message =
            data.reason === 'booked' ? 'Khoảng thời gian đã được đặt trước.'
          : data.reason === 'blocked' ? 'Khoảng thời gian này đang bị chặn.'
          : data.reason === 'reserved' ? 'Đang giữ chỗ tạm thời.'
          : 'Hiện không khả dụng cho toàn bộ khoảng thời gian.';
        }
      } else if (Array.isArray(data.days)) {
        const counts = data.days.reduce((acc, d) => {
          acc[d.status] = (acc[d.status] || 0) + 1;
          return acc;
        }, {});
        if (counts.booked || counts.blocked) {
          level = 'error';
          message = 'Có ngày đã “booked/blocked” trong khoảng chọn — không thể thuê.';
        } else if (counts.reserved && !counts.available) {
          level = 'warn';
          message = 'Toàn bộ ngày đang ở trạng thái giữ chỗ (reserved).';
        } else if (counts.reserved && counts.available) {
          level = 'warn';
          message = 'Một phần ngày đang giữ chỗ. Vui lòng chọn khoảng khác.';
        } else {
          level = 'ok';
          message = 'Phòng TRỐNG toàn bộ khoảng thời gian đã chọn.';
        }
      }

      setStatus({ level, message });
    } catch (err) {
      console.error(err);
      setStatus({ level: 'error', message: 'Lỗi khi kiểm tra lịch. Vui lòng thử lại.' });
    } finally {
      setChecking(false);
    }
  };

  const onRentNow = () => {
    const params = buildQuery();
    navigate(`/booking/${UID}?${params}`, { state: { guests, totalGuests } });
  };

  const onGoAuction = () => {
    const params = buildQuery();
    navigate(`/auction-check/${UID}?${params}`, { state: { guests, totalGuests } });
  };

  return (
    <div className="booking-card">
      <div className="booking-card-content">
        <h3>Đặt phòng</h3>

        {/* Banner trạng thái */}
        {status && <div className={`availability-banner ${status.level}`}>{status.message}</div>}

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
                if (checkoutDate && checkoutDate < v) setCheckoutDate('');
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
                  setCheckoutDate('');
                }
              }}
              className="date-input"
            />
          </div>
        </div>

        <div className="guest-selector">
          <label>Số lượng khách</label>
          <div className="guest-input" onClick={() => setShowGuestDropdown(!showGuestDropdown)}>
            <span>{guestText}</span>
            <img src={showGuestDropdown ? upIcon : downIcon} alt="dropdown" className="dropdown-arrow" />
          </div>

          {/* Gợi ý giới hạn */}
          <div className="hint-line">
            Tối đa <b>{maxGuests}</b> khách (tính <b>người lớn + trẻ em</b>, không tính <b>em bé</b>).
          </div>

          {showGuestDropdown && (
            <div className="guest-dropdown">
              {/* Adults */}
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
                    disabled={reachedLimit}
                    title={reachedLimit ? `Đã đạt tối đa ${maxGuests} (người lớn + trẻ em)` : ''}
                  >+</button>
                </div>
              </div>

              {/* Children */}
              <div className="guest-option">
                <div className="guest-info">
                  <span className="guest-type">Trẻ em</span>
                  <span className="guest-description">Từ 2–12 tuổi</span>
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
                    disabled={reachedLimit}
                    title={reachedLimit ? `Đã đạt tối đa ${maxGuests} (người lớn + trẻ em)` : ''}
                  >+</button>
                </div>
              </div>

              {/* Infants */}
              <div className="guest-option">
                <div className="guest-info">
                  <span className="guest-type">Em bé</span>
                  <span className="guest-description">Dưới 2 tuổi (không tính vào giới hạn)</span>
                </div>
                <div className="guest-controls">
                  <button
                    type="button"
                    onClick={() => updateGuests('infants', 'decrease')}
                    disabled={guests.infants <= 0}
                  >-</button>
                  <span>{guests.infants}</span>
                  <button type="button" onClick={() => updateGuests('infants', 'increase')}>+</button>
                </div>
              </div>

              {reachedLimit && (
                <div className="limit-warning">
                  Đã đạt giới hạn {maxGuests} khách (người lớn + trẻ em).
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="check-calendar-button"
          type="button"
          onClick={onCheckAvailability}
          disabled={checking}
        >
          {checking ? 'Đang kiểm tra...' : 'Kiểm tra lịch'}
        </button>

        {status?.level === 'ok' && (
          <div className="action-buttons">
            <button className="check-calendar-button rent-now-button" type="button" onClick={onRentNow}>
              Thuê ngay
            </button>
            <button className="check-calendar-button go-auction-button" type="button" onClick={onGoAuction}>
              Đấu giá
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCard;
