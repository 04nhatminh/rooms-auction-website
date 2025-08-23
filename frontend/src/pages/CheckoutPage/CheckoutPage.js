import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import './CheckoutPage.css';
import checkoutApi from '../../api/checkoutApi'; // ✅ add missing import

/**
 * Trang Checkout đơn giản:
 * - Hiển thị: Room name, Check-in, Check-out, Winning price (VND)
 * - Chọn phương thức thanh toán: PayPal / ZaloPay
 * - Nhấn "Pay now": gọi BE tạo order và mở popup approve (PayPal) hoặc order_url (ZaloPay)
 *
 * API (mặc định):
 *  - GET  /api/bookings/:bookingId         -> { ok, data: { roomName, checkIn, checkOut, WinningPrice } }
 *  - POST /api/payments/paypal/create      -> { ok, approveUrl, orderId }
 *  - POST /api/payments/zalopay/create     -> { ok, zalo: { order_url, app_trans_id, ... } }
 */

// --- Simple currency helper: VND -> USD ---
const VND_PER_USD = 25000; // keep it simple; or move to env later
const vndToUsd = (vnd, rate = VND_PER_USD) =>
  Math.round((Number(vnd || 0) / Number(rate || VND_PER_USD)) * 100) / 100;

const CheckoutPage = () => {
  const { bookingId } = useParams(); // route: /checkout/:bookingId
  
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [method, setMethod] = useState('ZALOPAY'); // 'PAYPAL' | 'ZALOPAY'
  const [paying, setPaying] = useState(false);
  
  const popupRef = useRef(null);
  const closeTimerRef = useRef(null);

  const startPopupWatcher = (onClose) => {
     if (closeTimerRef.current) clearInterval(closeTimerRef.current);
     closeTimerRef.current = setInterval(() => {
       if (popupRef.current && popupRef.current.closed) {
         clearInterval(closeTimerRef.current);
         closeTimerRef.current = null;
         popupRef.current = null;
         onClose && onClose();
       }
     }, 400);
   };
  //load booking ban đầu
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    checkoutApi
      .getBooking(bookingId, ac.signal)
      .then(setBooking)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message || 'Load booking failed');
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [bookingId]);

  //lắng nghe message từ popup
  useEffect(() => {
    const onMsg = (e) => {
      if (e?.data?.type === 'paypal-captured') {
        // Refetch để cập nhật trạng thái sau capture
        const ac = new AbortController();
        checkoutApi.getBooking(bookingId, ac.signal).then(setBooking).catch(() => {});
        // đóng watcher nếu còn
        if (closeTimerRef.current) { clearInterval(closeTimerRef.current); closeTimerRef.current = null; }
        // Nếu popup vẫn mở thì đóng lại
        try { if (popupRef.current && !popupRef.current.closed) popupRef.current.close(); } catch {}
        navigate('/'); // <-- về Home
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [bookingId, navigate]);

  const formatDate = (iso) => {
    if (!iso) return '--';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const priceVND = useMemo(() => {
    const v = Number(booking?.Amount || 0); // consider standardizing to one casing
    return v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  }, [booking]);

  const openPopup = (url) => {
    const w = 520;
    const h = 720;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    return window.open(url, 'payment_popup', `width=${w},height=${h},left=${left},top=${top}`);
  };

  const onPay = async () => {
    if (!booking) return;
    setPaying(true);
    try {
      const amountVND = Number(booking.WinningPrice || 0);

      if (method === 'ZALOPAY') {
        // ZaloPay expects VND
        const res = await fetch('/api/checkout/zalopay/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId, amount: amountVND }),
        });
        const json = await res.json();
        if (!json?.ok || !json?.zalo?.order_url)
          throw new Error(json?.error || 'Create ZaloPay order failed');
        const popup = openPopup(json.zalo.order_url);
        if (!popup) alert('Popup blocked. Hãy cho phép popup cho trang này.');
      } else {
        // PAYPAL expects USD -> convert from VND simply
        const amountUSD = vndToUsd(amountVND); // simple conversion here
        const { approveUrl } = await checkoutApi.createPayPalOrder({ bookingId, amount: amountUSD });
        if (!approveUrl)
          throw new Error(error || 'Create PayPal order failed');
        const popup = openPopup(approveUrl);
        if (!popup) alert('Popup blocked. Hãy cho phép popup cho trang này.');
        popupRef.current = openPopup(approveUrl);
        if (!popupRef.current) alert('Popup blocked. Hãy cho phép popup cho trang này.');
        // Về Home khi popup đóng (fallback nếu user tự đóng không thanh toán)
        startPopupWatcher(() => navigate('/'));
      }
    } catch (e) {
      alert(e.message || 'Payment error');
    } finally {
      setPaying(false);
    }
  };
  
  useEffect(() => {
    return () => { if (closeTimerRef.current) clearInterval(closeTimerRef.current); };
  }, []);

  if (error)
    return (
      <div className="checkout-page">
        <Header />
        <main className="checkout-content">
          <p style={{ color: '#DC2626' }}>{error}</p>
        </main>
      </div>
    );

  if (loading || !booking)
    return (
      <div className="checkout-page">
        <Header />
        <main className="checkout-content">
          <p>Loading...</p>
        </main>
      </div>
    );

  return (
    <div className="checkout-page">
      {/* Header giữ nguyên phong cách như RoomDetailPage */}
      <Header />

      <main className="checkout-content">
        <h2 style={{ marginTop: 16 }}>Checkout</h2>
        <div className="checkout-main">
          {/* LEFT: Booking summary */}
          <section className="checkout-left">
            <div className="summary-card">
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>Booking Summary</h3>
              <div className="summary-row">
                <span className="summary-label">Phòng</span>
                <span className="summary-value">{booking.Name || '--'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Check-in</span>
                <span className="summary-value">{formatDate(booking.StartDate)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Check-out</span>
                <span className="summary-value">{formatDate(booking.EndDate)}</span>
              </div>
              <hr />
              <div className="summary-row">
                <span className="summary-label">Winning Price</span>
                <span className="summary-value">{priceVND}</span>
              </div>
            </div>
          </section>

          {/* RIGHT: Payment */}
          <aside className="checkout-right">
            <div className="payment-card">
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>Payment</h3>

              <div className="method-group">
                <label className="method-option">
                  <input
                    type="radio"
                    name="method"
                    value="ZALOPAY"
                    checked={method === 'ZALOPAY'}
                    onChange={() => setMethod('ZALOPAY')}
                  />
                  <span>ZaloPay</span>
                </label>

                <label className="method-option">
                  <input
                    type="radio"
                    name="method"
                    value="PAYPAL"
                    checked={method === 'PAYPAL'}
                    onChange={() => setMethod('PAYPAL')}
                  />
                  <span>PayPal</span>
                </label>
              </div>

              <button className="pay-btn" onClick={onPay} disabled={paying}>
                {paying ? 'Processing...' : 'Pay now'}
              </button>

              <p className="note">
                Thanh toán sẽ mở trong popup của {method === 'ZALOPAY' ? 'ZaloPay' : 'PayPal'}.<br />
                Sau khi xác nhận, hệ thống sẽ cập nhật trạng thái booking tự động qua webhook.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
