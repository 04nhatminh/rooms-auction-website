import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import './CheckoutReturnPage.css';
import checkoutApi from '../../api/checkoutApi';

export default function CheckoutReturnPage() {
  const [sp] = useSearchParams();
  const [msg, setMsg] = useState('Completing payment...');
  const [sub, setSub] = useState('');
  const token = sp.get('token');       // PayPal puts Order ID in ?token=
  const bookingId = sp.get('bookingId');

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        console.log('ReturnPage params:', { token, bookingId });
        if (!token || !bookingId) {
          throw new Error('Missing token or bookingId in return URL');
        }
        const guardKey = `pp-capture:${bookingId}:${token}`;

        if (sessionStorage.getItem(guardKey)) {
          setMsg('Payment already processed. You may close this window.');
          setTimeout(() => window.close(), 700);
          return;
        }
        sessionStorage.setItem(guardKey, '1');


        setSub(`Order: ${token} • Booking: ${bookingId}`);

        // Call API helper (it throws if not ok)
        await checkoutApi.capturePayPalOrder(
          { bookingId, orderID: token },
          ac.signal
        );

        window.opener?.postMessage({ type: 'paypal-captured', bookingId }, '*');
        setMsg('Payment completed successfully.');
        setTimeout(() => window.close(), 5000);
      } catch (e) {
        // BỎ QUA AbortError do cleanup StrictMode
        if (e?.name === 'AbortError') return;
        setMsg(e?.message || 'Error completing payment');
        setSub('You can close this window and try again.');
        console.error('CheckoutReturnPage error:', e);
      }
    })();
    return () => ac.abort();
  }, [token, bookingId]);

  return (
    <div className="checkout-page">
      <Header />
      <main className="checkout-content">
        <div className="return-card">
          <h2 style={{ margin: 0, marginBottom: 4 }}>PayPal Return</h2>
          <p className="return-status">{msg}</p>
          {sub && <p className="return-sub">{sub}</p>}
          <button className="return-close" onClick={() => window.close()}>Close</button>
        </div>
      </main>
    </div>
  );
}


