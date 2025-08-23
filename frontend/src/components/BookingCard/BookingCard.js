// src/components/BookingCard/BookingCard.js
import React, { useState, useContext, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './BookingCard.css';
import upIcon from '../../assets/up.png';
import downIcon from '../../assets/down.png';
import { useDateRange } from '../../contexts/DateRangeContext';
import { ProductContext } from '../../contexts/ProductContext';
import calendarApi from '../../api/calendarApi';
import bookingApi from '../../api/bookingApi';
import ConfirmBookingPopup from '../ConfirmBookingPopup/ConfirmBookingPopup';
import AuthPopup from '../AuthPopup/AuthPopup';

const useCurrentUserId = () => useMemo(() => {
    try {
      const raw = sessionStorage.getItem('userData');
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj?.id ?? obj?.userId ?? null; // phòng trường hợp key là userId
    } catch { return null; }
}, []);

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const unitPrice = Number(data?.details?.Price || 0);
  const nights = checkinDate && checkoutDate ? Math.max(1, Math.floor((new Date(checkoutDate) - new Date(checkinDate)) / 86400000)) : 0;

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

  const currentUserId = useCurrentUserId();

  const onCheckAvailability = async () => {
    if (!checkinDate) return alert('Vui lòng chọn ngày nhận phòng');
    if (!checkoutDate) return alert('Vui lòng chọn ngày trả phòng');
    if (new Date(checkoutDate) <= new Date(checkinDate)) {
      return alert('Ngày trả phòng phải sau ngày nhận phòng');
    }

    try {
      setChecking(true);
      setStatus(null);

      const data = await calendarApi.checkAvailability(UID, {
        checkin: checkinDate,
        checkout: checkoutDate,
        userId: currentUserId,
      });

      let tag = 'available';
      let level = 'ok';
      let message = 'Đang trống.';

      // BE sẽ trả: { available:boolean, reason:'booked'|'blocked'|'reserved'|null, reservedBySelf?:boolean, hasAuction?:boolean, days:[...] }
      if (!data.available) {
        if (data.reason === 'reserved') {
          if (data.reservedBySelf) {
            tag = 'reserved'; level = 'warn'; message = 'Đang giữ chỗ tạm thời (của bạn).';
          } else {
            tag = 'soldout'; level = 'error'; message = 'Đã hết chỗ ở khoảng thời gian này.';
          }
        } else if (data.reason === 'booked' || data.reason === 'blocked') {
          tag = 'soldout'; level = 'error'; message = data.reason === 'booked'
            ? 'Khoảng thời gian đã được đặt trước.'
            : 'Khoảng thời gian này đang bị chặn.';
        } else {
          tag = 'soldout'; level = 'error'; message = 'Không khả dụng cho toàn bộ khoảng thời gian.';
        }
      } else {
        tag = data.hasAuction ? 'auction' : 'available';
        level = 'ok';
        message = data.hasAuction ? 'Đang có đấu giá cho các ngày đã chọn.' : 'Đang trống toàn bộ khoảng thời gian.';
      }

      setStatus({ tag, level, message });
    } catch (err) {
      console.error(err);
      setStatus({ tag: 'soldout', level: 'error', message: 'Lỗi khi kiểm tra lịch. Vui lòng thử lại.' });
    } finally {
      setChecking(false);
    }
  };

  const onRentNow = () => {
    if (!checkinDate || !checkoutDate) return alert('Vui lòng chọn ngày nhận phòng và trả phòng');
    setShowConfirm(true);
  };

  const doPlace = async () => {
    const userData = JSON.parse(sessionStorage.getItem('userData') || 'null') || JSON.parse(localStorage.getItem('userData') || 'null');
    const currentUserId = userData?.id;
    if (!currentUserId) {
      console.log("showLogin");
      setShowLogin(true);
      return;
    }

    const payload = {
      uid: UID,
      userId: currentUserId,
      checkin: checkinDate,
      checkout: checkoutDate,
      holdMinutes: 30,
    };

    const r = await bookingApi.place(payload);
    setShowConfirm(false);

    const params = buildQuery?.() || '';
    navigate(`/checkout/${r.bookingId}${params ? `?${params}` : ''}`, {
      state: { guests, totalGuests, bookingId: r.bookingId, holdExpiresAt: r.holdExpiresAt }
    });
  };

  const onConfirmPlace = async () => {
    try {
      await doPlace();
    } catch (e) {
      alert(e.message || 'Khoảng thời gian không còn trống, vui lòng chọn lại.');
    }
  };

  const onGoAuction = () => {
    const params = buildQuery();
    navigate(`/auction-check/${UID}?${params}`, { state: { guests, totalGuests } });
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

        {/* Banner trạng thái */}
        {status && <div className={`availability-banner status-${status.tag}`}>{status.message}</div>}

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

        <AuthPopup
          open={showLogin}
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false);
            // đăng nhập xong thì tiếp tục flow đặt chỗ
            doPlace();
          }}
        />

        <ConfirmBookingPopup
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={onConfirmPlace}
          unitPrice={unitPrice}
          nights={nights}
          currency={data?.details?.Currency || 'VND'}
          checkin={checkinDate}
          checkout={checkoutDate}
          guests={{
            adults: guests?.adults ?? totalGuests ?? 1,   // tuỳ state bạn đang dùng
            children: guests?.children ?? 0,
            infants: guests?.infants ?? 0,
          }}
        />
      </div>
    </div>
  );
};

export default BookingCard;
