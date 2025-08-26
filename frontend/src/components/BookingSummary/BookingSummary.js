// src/components/ConfirmBookingPopup/BookingSummary.js
import React, { useMemo, useEffect } from 'react';
import '../ConfirmBookingPopup/ConfirmBookingPopup.css';

export default function BookingSummary({
  title = 'Thông tin đặt phòng',
  unitPrice,
  nights,
  currency = 'VND',
  checkin,           // ISO string/Date
  checkout,          // ISO string/Date
  guests = { adults: 1, children: 0, infants: 0 },
  showActions = false,   // mặc định KHÔNG hiển thị nút
  onClose,
  onTotalChange,
  onConfirm,
  className = '',
  style = {},
}) {
  // Tính toán tiền (giữ đúng công thức đã dùng trong popup)
  const roomTotal = useMemo(
    () => (Number(unitPrice) || 0) * (Number(nights) || 0),
    [unitPrice, nights]
  );
  const serviceFee = useMemo(() => Math.round(roomTotal * 0.15), [roomTotal]);
  const grandTotal = roomTotal + serviceFee;

  useEffect(() => {
    if (typeof onTotalChange === 'function') onTotalChange(grandTotal);
  }, [grandTotal, onTotalChange]);

  // Format ngày (giống popup)
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString('vi-VN', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '';

  const { adults = 1, children = 0, infants = 0 } = guests || {};

  // KHÔNG backdrop, KHÔNG portal: render thẳng card inline
  return (
    <div className={`cbm-card ${className}`} style={style} role="region" aria-label="Tóm tắt đặt phòng">
      <h3 className="cbm-title">{title}</h3>

      <div className="cbm-section">
        <div className="cbm-row"><span>Ngày nhận phòng</span><b>{fmt(checkin)}</b></div>
        <div className="cbm-row"><span>Ngày trả phòng</span><b>{fmt(checkout)}</b></div>
        <div className="cbm-row">
          <span>Số khách</span>
          <b>{adults} người lớn • {children} trẻ em • {infants} em bé</b>
        </div>
      </div>

      <div className="cbm-section">
        <div className="cbm-row"><span>Giá 1 đêm</span><b>{Number(unitPrice || 0).toLocaleString()} {currency}</b></div>
        <div className="cbm-row"><span>Số đêm</span><b>{nights}</b></div>
        <div className="cbm-row"><span>Tổng tiền phòng</span><b>{roomTotal.toLocaleString()} {currency}</b></div>
        <div className="cbm-row"><span>Phí dịch vụ</span><b>{serviceFee.toLocaleString()} {currency}</b></div>
        <div className="cbm-row cbm-total"><span>Tổng thanh toán</span><b>{grandTotal.toLocaleString()} {currency}</b></div>
      </div>

      {showActions && (
        <div className="cbm-actions">
          <button className="cbm-btn cbm-btn-ghost" type="button" onClick={onClose}>Đóng</button>
          <button className="cbm-btn cbm-btn-primary" type="button" onClick={onConfirm}>Xác nhận đặt</button>
        </div>
      )}
    </div>
  );
}
