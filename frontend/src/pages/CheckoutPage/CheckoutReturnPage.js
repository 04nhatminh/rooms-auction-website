import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import './CheckoutReturnPage.css';
import checkoutApi from '../../api/checkoutApi';

export default function CheckoutReturnPage() {
  const [sp] = useSearchParams();
  const [msg, setMsg] = useState('Completing payment...');
  const [sub, setSub] = useState('');

  // ---- Common params / provider hints ----
  const token = sp.get('token');                                  // PayPal: ?token=...
  const provider = (sp.get('provider') || '').toUpperCase();      // optional hint

  // ---- ZaloPay params ----
  const appTransId = sp.get('app_trans_id') || sp.get('apptransid');
  const zpStatus   = sp.get('status');                             // '1' | 'success' | 'cancelled' | '0'
  const initialBookingId = sp.get('bookingId') || sp.get('booking');
  console.log('initialBookingId:', initialBookingId);

  // ---- VNPay params ----
  const vnpTxnRef            = sp.get('vnp_TxnRef') || sp.get('vnptxnref');
  const vnpResponseCode      = sp.get('vnp_ResponseCode') || sp.get('vnpresponsecode');       // '00' success
  const vnpTransactionStatus = sp.get('vnp_TransactionStatus') || sp.get('vnptransactionstatus'); // '00' success

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        // --- Detect provider ---
        const isPayPal = !!token || provider === 'PAYPAL';
        const isVNPay  = provider === 'VNPAY' || !!vnpTxnRef;

        // bookingId (không sửa biến ngoài hook)
        const bookingId = initialBookingId;

        // --- Validate ---
        if (!bookingId) {
          window.opener?.postMessage({ type: 'paypal-captured', status: 'failed' }, '*');
          setMsg('Missing bookingId in return URL');
          setTimeout(() => window.close(), 500);
          return;
        }

        // ===== PayPal flow (giữ nguyên) =====
        if (isPayPal) {
          if (!token) {
            window.opener?.postMessage({ type: 'paypal-captured', bookingId, status: 'failed' }, '*');
            window.close();
            return;
          }
          const guardKey = `pp-capture:${bookingId}:${token}`;
          if (sessionStorage.getItem(guardKey)) {
            setMsg('Payment already processed. Please do not do anything. The window will close shortly.');
            try {
              console.log('Capturing PayPal order', { bookingId, orderID: token });
              await checkoutApi.capturePayPalOrder({ bookingId, orderID: token }, ac.signal);
              window.opener?.postMessage({ type: 'paypal-captured', bookingId, status: 'success' }, '*');
              setMsg('Payment completed successfully.');
            } catch (e) {
              window.opener?.postMessage({ type: 'paypal-captured', bookingId, status: 'failed' }, '*');
              setMsg('Payment failed.');
            }
            setTimeout(() => window.close(), 500);
            return;
          }
          sessionStorage.setItem(guardKey, '1');
          setSub(`Provider: PayPal • Order: ${token} • Booking: ${bookingId}`);

          // await checkoutApi.capturePayPalOrder({ bookingId, orderID: token }, ac.signal);
          // window.opener?.postMessage({ type: 'paypal-captured', bookingId, status: 'success' }, '*');
          // setMsg('Payment completed successfully.');
          // setTimeout(() => window.close(), 1500);
          
          return;
        }

        console.log('BookingId detected:', bookingId);

        // Redirect target (dùng chung)
        const redirect = sp.get('redirect') || `/checkout/return?provider=${isVNPay ? 'VNPAY' : 'ZALOPAY'}&status=processing&bookingId=${bookingId}`;

        // ZaloPay: hiển thị trạng thái theo ?status
        let human = 'Processing via ZaloPay...';
        if (zpStatus === '1' || (zpStatus || '').toLowerCase() === 'success') {
          human = 'Payment success. We will update your booking shortly.';
        } else if ((zpStatus || '').toLowerCase() === 'cancelled' || zpStatus === '0') {
          human = 'Payment cancelled.';
        }
        setSub(`Provider: ZaloPay • Booking: ${bookingId}`);
        setMsg(human);

        const success = (zpStatus === '1') || ((zpStatus || '').toLowerCase() === 'success');
        // const payload = { type: 'zalopay-return', bookingId, status: success ? 'success' : 'processing', redirect };
        const payload = { type: 'zalopay-return', bookingId, status: success ? 'success' : 'failed' };


        console.log('ZaloPay return payload', payload);

        try { window.opener?.postMessage(payload, '*'); } catch {}
        // try {
        //   if (window.opener && !window.opener.closed) {
        //     window.opener.location.href = redirect;
        //   }
        // } catch {}

        window.close();
        setTimeout(() => { window.location.replace(redirect); }, 150);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        setMsg(e?.message || 'Error completing payment');
        setSub('You can close this window and try again.');
        console.error('CheckoutReturnPage error:', e);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    token,
    provider,
    appTransId,
    zpStatus,
    initialBookingId,
    vnpTxnRef,
    vnpResponseCode,
    vnpTransactionStatus,
  ]);

  return (
    <div className="checkout-page">
      <Header />
      <main className="checkout-content">
        <div className="return-card">
          <h2 style={{ margin: 0, marginBottom: 4 }}>Trang phản hồi thanh toán</h2>
          <p className="return-status">{msg}</p>
          {sub && <p className="return-sub">{sub}</p>}
          {/* <button className="return-close" onClick={() => window.close()}>Close</button> */}
        </div>
      </main>
    </div>
  );
}
