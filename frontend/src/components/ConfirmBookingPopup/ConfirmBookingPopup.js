import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmBookingPopup.css';
import systemParametersApi from '../../api/systemParametersApi';

export default function ConfirmBookingPopup({
  open,
  onClose,
  onConfirm,
  unitPrice,
  nights,
  currency = 'VND',
  checkin,           // ISO string/Date
  checkout,          // ISO string/Date
  guests = { adults: 1, children: 0, infants: 0 },
}) {
  // ---- Fetch System Parameters (ServiceFeeFactor) ----
  const [loadingParams, setLoadingParams] = useState(false);
  const [paramsErr, setParamsErr] = useState(null);
  const [serviceFeeFactor, setServiceFeeFactor] = useState(0.15); // mặc định 15%

  useEffect(() => {
    if (!open) return; // chỉ fetch khi popup mở
    const ac = new AbortController();
    (async () => {
      try {
        setLoadingParams(true);
        setParamsErr(null);
        const res = await systemParametersApi.getAllParameters(ac.signal);

        // Chuẩn hoá: backend có thể trả { data: {...} } hoặc { data: [...] } hoặc {...}
        const raw = res?.data ?? res;

        // Nếu là mảng [{ParamName, ParamValue}, ...] -> map về object
        const obj = Array.isArray(raw)
          ? Object.fromEntries(
              raw
                .filter(x => x && x.ParamName != null)
                .map(x => [x.ParamName, x.ParamValue])
            )
          : raw;

        // Lấy hệ số, ưu tiên các key phổ biến
        const v =
          obj?.ServiceFeeFactor ??
          obj?.serviceFeeFactor ??
          obj?.SERVICE_FEE_FACTOR;

        const parsed = Number(v);
        setServiceFeeFactor(Number.isFinite(parsed) ? parsed : 0.15);
      } catch (e) {
        if (e.name !== 'AbortError') setParamsErr(e.message || String(e));
        // Giữ mặc định 0.15 khi lỗi
      } finally {
        setLoadingParams(false);
      }
    })();
    return () => ac.abort();
  }, [open]);

  // ---- Tính toán tiền ----
  const roomTotal = useMemo(
    () => (Number(unitPrice) || 0) * (Number(nights) || 0),
    [unitPrice, nights]
  );

  const serviceFee = useMemo(
    () => Math.round(roomTotal * serviceFeeFactor),
    [roomTotal, serviceFeeFactor]
  );

  const grandTotal = useMemo(
    () => roomTotal + serviceFee,
    [roomTotal, serviceFee]
  );

  // ---- Format ngày ----
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString('vi-VN', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '';

  // ---- Khóa scroll + ESC khi mở ----
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const { adults = 1, children = 0, infants = 0 } = guests || {};
  const feePercentLabel = `${Math.round(serviceFeeFactor * 100)}%`;

  const content = (
    <div className="cbm-backdrop" onClick={onClose}>
      <div
        className="cbm-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="cbm-title">Xác nhận đặt</h3>

        <div className="cbm-section">
          <div className="cbm-row">
            <span>Ngày nhận phòng</span>
            <b>{fmt(checkin)}</b>
          </div>
          <div className="cbm-row">
            <span>Ngày trả phòng</span>
            <b>{fmt(checkout)}</b>
          </div>
          <div className="cbm-row">
            <span>Số khách</span>
            <b>
              {adults} người lớn • {children} trẻ em • {infants} em bé
            </b>
          </div>
        </div>

        <div className="cbm-section">
          <div className="cbm-row">
            <span>Giá 1 đêm</span>
            <b>{Number(unitPrice || 0).toLocaleString()} {currency}</b>
          </div>
          <div className="cbm-row">
            <span>Số đêm</span>
            <b>{nights}</b>
          </div>
          <div className="cbm-row">
            <span>Tổng tiền phòng</span>
            <b>{roomTotal.toLocaleString()} {currency}</b>
          </div>
          <div className="cbm-row">
            <span>Phí dịch vụ ({feePercentLabel})</span>
            <b>{serviceFee.toLocaleString()} {currency}</b>
          </div>
          <div className="cbm-row cbm-total">
            <span>Tổng thanh toán</span>
            <b>{grandTotal.toLocaleString()} {currency}</b>
          </div>

          {loadingParams && (
            <div className="cbm-hint">Đang tải tham số hệ thống…</div>
          )}
          {paramsErr && (
            <div className="cbm-error">Không lấy được ServiceFeeFactor: {paramsErr}. Dùng mặc định 15%.</div>
          )}
        </div>

        <div className="cbm-actions">
          <button className="cbm-btn cbm-btn-ghost" type="button" onClick={onClose}>
            Hủy
          </button>
          <button
            className="cbm-btn cbm-btn-primary"
            type="button"
            onClick={onConfirm}
            disabled={loadingParams}
            title={loadingParams ? 'Đang tải tham số…' : 'Xác nhận đặt'}
          >
            Xác nhận đặt
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
