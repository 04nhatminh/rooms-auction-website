// src/components/ConfirmBookingPopup/ConfirmBookingPopup.js
import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmBookingPopup.css';

export default function ConfirmBookingPopup({
  open,
  onClose,
  onConfirm,
  unitPrice,
  nights,
  currency = 'VND',
  checkin,           // ISO string/Date
  checkout,          // ISO string/Date
  guests = { adults: 1, children: 0, infants: 0 }, // {người lớn, trẻ em, em bé}
}) {
  // Tính toán tiền
  const roomTotal = useMemo(
    () => (Number(unitPrice) || 0) * (Number(nights) || 0),
    [unitPrice, nights]
  );
  const serviceFee = useMemo(() => Math.round(roomTotal * 0.15), [roomTotal]);
  const grandTotal = roomTotal + serviceFee;

  // Format ngày
  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

  // Khóa scroll + ESC
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;

  const { adults = 1, children = 0, infants = 0 } = guests || {};

  const content = (
    <div className="cbm-backdrop" onClick={onClose}>
      <div className="cbm-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className="cbm-title">Xác nhận đặt</h3>

        <div className="cbm-section">
          <div className="cbm-row"><span>Ngày nhận phòng</span><b>{fmt(checkin)}</b></div>
          <div className="cbm-row"><span>Ngày trả phòng</span><b>{fmt(checkout)}</b></div>
          <div className="cbm-row">
            <span>Số khách</span>
            <b>{adults} người lớn • {children} trẻ em • {infants} em bé</b>
          </div>
        </div>

        <div className="cbm-section">
          <div className="cbm-row"><span>Giá 1 đêm</span><b>{Number(unitPrice||0).toLocaleString()} {currency}</b></div>
          <div className="cbm-row"><span>Số đêm</span><b>{nights}</b></div>
          <div className="cbm-row"><span>Tổng tiền phòng</span><b>{roomTotal.toLocaleString()} {currency}</b></div>
          <div className="cbm-row"><span>Phí dịch vụ</span><b>{serviceFee.toLocaleString()} {currency}</b></div>
          <div className="cbm-row cbm-total"><span>Tổng thanh toán</span><b>{grandTotal.toLocaleString()} {currency}</b></div>
        </div>

        <div className="cbm-actions">
          <button className="cbm-btn cbm-btn-ghost" type="button" onClick={onClose}>Hủy</button>
          <button className="cbm-btn cbm-btn-primary" type="button" onClick={onConfirm}>Xác nhận đặt</button>
        </div>
      </div>
    </div>
  );
  return createPortal(content, document.body);
}
