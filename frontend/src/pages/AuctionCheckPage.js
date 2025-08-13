import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom'; // ⬅️ add useParams
import './AuctionCheckPage.css';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
}

export default function AuctionCheckPage() {
  const navigate = useNavigate();
  const { state } = useLocation() || {};
  const query = useQuery();
  const { UID: uidFromPath } = useParams(); // ⬅️ read /auction-check/:UID

  // Merge data: path param > state > query params
  const data = useMemo(() => {
    const q = {
      uid: query.uid || '',
      checkin: query.checkin || '',
      checkout: query.checkout || '',
      adults: query.adults ? Number(query.adults) : undefined,
      children: query.children ? Number(query.children) : undefined,
      infants: query.infants ? Number(query.infants) : undefined,
      totalGuests: query.totalGuests ? Number(query.totalGuests) : undefined,
    };

    const merged = {
      uid:
        uidFromPath ??                // ⬅️ path wins
        (state && state.uid) ??       // then navigation state
        q.uid,                        // then query
      checkin: (state && state.checkin) ?? q.checkin,
      checkout: (state && state.checkout) ?? q.checkout,
      guests: (state && state.guests) ?? {
        adults: q.adults ?? 0,
        children: q.children ?? 0,
        infants: q.infants ?? 0,
      },
      totalGuests:
        (state && state.totalGuests) ??
        q.totalGuests ??
        ((q.adults ?? 0) + (q.children ?? 0) + (q.infants ?? 0)),
    };

    return merged;
  }, [state, query, uidFromPath]);

  useEffect(() => {
    /* eslint-disable no-console */
    console.log('🔎 Auction Check Data:', data);
    /* eslint-enable no-console */
  }, [data]);

  const hasDates = Boolean(data.checkin && data.checkout);

  return (
    <div className="auction-check">
      <header className="auction-check__header">
        <h1>Kiểm tra phiên đấu giá</h1>
        <button className="auction-check__back" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>
      </header>

      {!hasDates && (
        <div className="auction-check__warning">
          Thiếu ngày nhận / trả phòng. Hãy quay lại chọn ngày.
        </div>
      )}

      <section className="auction-check__card">
        <div className="row">
          <span className="label">UID phòng:</span>
          <span className="value">{data.uid || '—'}</span>
        </div>
        <div className="row">
          <span className="label">Nhận phòng:</span>
          <span className="value">{data.checkin || '—'}</span>
        </div>
        <div className="row">
          <span className="label">Trả phòng:</span>
          <span className="value">{data.checkout || '—'}</span>
        </div>
        <div className="row">
          <span className="label">Khách (tổng):</span>
          <span className="value">{data.totalGuests ?? '—'}</span>
        </div>
        <div className="row">
          <span className="label">Chi tiết khách:</span>
          <span className="value">
            NL: {data.guests?.adults ?? 0} · TE: {data.guests?.children ?? 0} · Em bé: {data.guests?.infants ?? 0}
          </span>
        </div>
      </section>

      <section className="auction-check__console">
        <h2>Console data</h2>
        <pre className="code-block">{JSON.stringify(data, null, 2)}</pre>
      </section>
    </div>
  );
}
