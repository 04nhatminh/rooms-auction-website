import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import './CheckoutPage.css';
import BookingSummary from '../../components/BookingSummary/BookingSummary';
import checkoutApi from '../../api/checkoutApi'; 
import zaloIcon from '../../assets/zalopay.png';
import paypalIcon from '../../assets/paypal.png';

/**
 * Trang Checkout đơn giản:
 * - Hiển thị: Room name, Check-in, Check-out, Winning price (VND)
 * - Chọn phương thức thanh toán: PayPal / ZaloPay
 * - Nhấn "Pay now": gọi BE tạo order và mở popup approve (PayPal) hoặc order_url (ZaloPay)
 *
 */

// --- Simple currency helper: VND -> USD ---
const VND_PER_USD = 25000; // keep it simple; or move to env later
const vndToUsd = (vnd, rate = VND_PER_USD) =>
  Math.round((Number(vnd || 0) / Number(rate || VND_PER_USD)) * 100) / 100;

const CheckoutPage = () => {
  const { bookingId } = useParams(); // route: /checkout/:bookingId
  
  const navigate = useNavigate();
  const [grandTotal, setGrandTotal] = useState(0);
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
   
 const productUidFromBooking = () =>
   booking?.UID ?? booking?.Uid ??
   booking?.ProductUID ?? booking?.ProductUid ??
   booking?.RoomUID ?? booking?.RoomUid ?? '';
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
      // if (e?.data?.type === 'paypal-captured' || e?.data?.type === 'zalopay-return') {
      //   // Refetch để cập nhật trạng thái sau capture
      //   const ac = new AbortController();
      //   checkoutApi.getBooking(bookingId, ac.signal).then(setBooking).catch(() => {});
      //   // đóng watcher nếu còn
      //   if (closeTimerRef.current) { clearInterval(closeTimerRef.current); closeTimerRef.current = null; }
      //   // Nếu popup vẫn mở thì đóng lại
      //   try { if (popupRef.current && !popupRef.current.closed) popupRef.current.close(); } catch {}
      //   navigate('/'); // <-- về Home
      // }
      const t = e?.data?.type;
      const st = e?.data?.status;
      const bid = e?.data?.bookingId || bookingId;
      if (t === 'paypal-captured' || t === 'zalopay-return') {
        // làm tươi booking
        const ac = new AbortController();
        checkoutApi.getBooking(bid, ac.signal).then(setBooking).catch(() => {});
        // đóng watcher/popup
        if (closeTimerRef.current) { clearInterval(closeTimerRef.current); closeTimerRef.current = null; }
        try { if (popupRef.current && !popupRef.current.closed) popupRef.current.close(); } catch {}
        // điều hướng
        if (st === 'success') {
          console.log('Navigate to success page');
          navigate('/checkout/success');
        } else {
          const pid = productUidFromBooking();
          navigate(`/checkout/failed${pid ? `?productUID=${pid}` : ''}${bid ? `${pid ? '&' : '?'}bookingId=${bid}` : ''}`);
        }
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [bookingId, navigate]);

  const nights = useMemo(() => {
  try {
    const s = new Date(booking?.StartDate);
    const e = new Date(booking?.EndDate);
    // set giờ 12:00 để tránh lệch múi giờ
    const ms = e.setHours(12,0,0,0) - s.setHours(12,0,0,0);
    return Math.max(1, Math.round(ms / (1000*60*60*24)));
  } catch { 
    return 1; 
  }
}, [booking?.StartDate, booking?.EndDate]);

  const openPopup = (url) => {
    const w = 520;
    const h = 720;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    return window.open(url, 'payment_popup', `width=${w},height=${h},left=${left},top=${top}`);
  };

  const onCancel = () => {
    const pid = productUidFromBooking();
    const bookingID = booking?.BookingID ?? booking?.BookingId ?? bookingId;
    if (!bookingID) return;

    checkoutApi.cancelBooking(bookingID)
      .catch(e => console.error('Cancel failed:', e))
      .finally(() => {
        if (pid) navigate(`/room/${pid}`); else navigate(-1);
      });               // fallback
  };

  const onPay = async () => {
    if (!booking) return;
    setPaying(true);
    try {
      const amountVND = Number(grandTotal || booking.Amount || 0);

      if (method === 'ZALOPAY') {
        // ZaloPay expects VND (dùng helper từ checkoutApi)
        const zalo = await checkoutApi.createZaloPayOrder({ bookingId, amount: amountVND });
        if (!zalo?.order_url) throw new Error('Create ZaloPay order failed');
        const popup = openPopup(zalo.order_url);
        if (!popup) alert('Popup blocked. Hãy cho phép popup cho trang này.');
      } 
      else {
        // PAYPAL expects USD -> convert from VND simply
        const amountUSD = vndToUsd(amountVND);
        const { approveUrl } = await checkoutApi.createPayPalOrder({ bookingId, amount: amountUSD });
        if (!approveUrl)
          throw new Error(error || 'Create PayPal order failed');
        popupRef.current = openPopup(approveUrl);
        if (!popupRef.current) alert('Popup blocked. Hãy cho phép popup cho trang này.');
        // Về Home khi popup đóng (fallback nếu user tự đóng không thanh toán)
        //startPopupWatcher(() => navigate('/'));
        // Nếu user đóng popup mà không có message -> coi như thất bại
        // startPopupWatcher(() => {
        //   const pid = productUidFromBooking();
        //   navigate(`/checkout/failed${pid ? `?productUID=${pid}` : ''}${bookingId ? `${pid ? '&' : '?'}bookingId=${bookingId}` : ''}`);
        // });
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
        <div className="checkout-main">
          <h2 className="checkout-title">Thanh toán đặt phòng</h2>
          <div className="checkout-body">
            {/* LEFT */}
            <section className="checkout-left">
              <BookingSummary
                unitPrice={Number(booking?.Amount || 0)}
                nights={nights}
                currency="VND"
                checkin={booking?.StartDate}
                checkout={booking?.EndDate}
                guests={{
                  adults: booking?.Adults ?? 1,
                  children: booking?.Children ?? 0,
                  infants: booking?.Infants ?? 0,
                }}
                onTotalChange={setGrandTotal}
                showActions={false}
                style={{ boxShadow: '0 0px 0px rgba(0,0,0,.18)' }}
              />
            </section>

            {/* RIGHT: Payment */}
            <aside className="checkout-right">
              <div className="payment-card">
                <h3>Chọn phương thức thanh toán</h3>

                <div className="method-group">
                  <button
                    type="button"
                    className={`method-option method-btn ${method === 'ZALOPAY' ? 'active' : ''}`}
                    onClick={() => setMethod('ZALOPAY')}
                    aria-pressed={method === 'ZALOPAY'}
                  >
                    <img
                      className="method-icon"
                      alt="ZaloPay"
                      src={zaloIcon} /* bạn sẽ tự đổi src */
                    />
                    <span>ZaloPay</span>
                  </button>

                  <button
                    type="button"
                    className={`method-option method-btn ${method === 'PAYPAL' ? 'active' : ''}`}
                    onClick={() => setMethod('PAYPAL')}
                    aria-pressed={method === 'PAYPAL'}
                  >
                    <img
                      className="method-icon"
                      alt="PayPal"
                      src={paypalIcon}   /* bạn sẽ tự đổi src */
                    />
                    <span>PayPal</span>
                  </button>
                </div>

                <button className="pay-btn" onClick={onPay} disabled={paying || booking?.BookingStatus === 'expired' || booking?.BookingStatus === 'cancelled'}>
                  {paying ? 'Đang xử lý...' : 'Thanh toán ngay'}
                </button>

                <button className="cancel-btn" onClick={onCancel} disabled={paying || booking?.BookingStatus === 'expired' || booking?.BookingStatus === 'cancelled'}>
                  Hủy
                </button>

                <p className="note">
                  Thanh toán sẽ mở trong popup của {method === 'ZALOPAY' ? 'ZaloPay' : 'PayPal'}.<br />
                </p>
                <p className="note"
                  style={{ marginTop: '-16px' }}>
                  Thanh toán sẽ hết hạn trong <strong>60 phút</strong>.<br />
                </p>

                {booking?.BookingStatus === 'expired' && (
                  <p className="expired-alert">Booking đã hết hạn thanh toán</p>  // ⬅ dòng thông báo
                )}

                {booking?.BookingStatus === 'cancelled' && (
                  <p className="expired-alert">Booking đã bị hủy</p>  // ⬅ dòng thông báo
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
