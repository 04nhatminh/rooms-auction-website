import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import auctionApi from '../../api/auctionApi';
import './BiddingForm.css';
import DownIcon from '../../assets/down.png';

function formatCurrencyVi(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return '';
    return num.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseBid(str) {
    if (!str) return null;
    const s = String(str).trim();
    const d = Math.max(s.lastIndexOf(','), s.lastIndexOf('.')); // dấu thập phân là dấu xuất hiện cuối
    if (d >= 0) {
        const decSep = s[d];
        const intPart = s.slice(0, d).replace(/[.,]/g, '');
        const fracPart = s.slice(d + 1);
        return parseFloat(intPart + '.' + fracPart);
    }
    return parseFloat(s.replace(/[.,]/g, ''));
}

function unformatForEdit(s) {
    if (!s) return '';
    // vi-VN: "100.000,02" -> "100000.02"; nếu đã là "100000.02" thì giữ nguyên
    return String(s).includes(',')
        ? String(s).replace(/\./g, '').replace(',', '.')
        : String(s);
}

const toCents  = (n) => Math.round(Number(n) * 100); // number -> int

const fromCents = (c) => c / 100;                     // int -> number

function toLocalDate(dstr) {
    // dstr: 'YYYY-MM-DD' -> Date local 00:00
    if (!dstr) return null;
    const [y, m, d] = dstr.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

function overlapsStay(ciStr, coStr, spStartStr, spEndStr) {
    // Thiếu dữ liệu phiên -> cho qua (tránh chặn nhầm)
    if (!spStartStr || !spEndStr) return true;
    const ci = toLocalDate(ciStr);
    const co = toLocalDate(coStr);
    const spS = toLocalDate(spStartStr);
    const spE = toLocalDate(spEndStr);

    if (!ci || !co || !spS || !spE) return false;

    // Giao theo nửa-mở: [checkin, checkout) ∩ [spS, spE) ≠ ∅
    return ci < spE && co > spS;
}

function toDMY(value) {
    if (!value) return '';
    // Ưu tiên xử lý thủ công khi là YYYY-MM-DD để tránh lệch timezone
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-');
        return `${d}/${m}/${y}`;
    }
    // Fallback cho Date/ISO khác
    try {
        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) return String(value);
        const dd = String(dt.getDate()).padStart(2, '0');
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const yyyy = dt.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    } catch {
        return String(value);
    }
}

const BiddingForm = ({
    currentPrice,
    bidIncrement,
    basePrice,
    checkin,
    checkout,
    stayPeriodStart,
    stayPeriodEnd,
    status,
    isEnded, // thêm prop này
    onChangeDates,
    onSubmit,
    onBuyNow,
}) => {
    const [bidValue, setBidValue] = useState('');
    const [focused, setFocused] = React.useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [ci, setCi] = useState(checkin || '');
    const [co, setCo] = useState(checkout || '');
    useEffect(() => { setCi(checkin || ''); }, [checkin]);
    useEffect(() => { setCo(checkout || ''); }, [checkout]);

    // Lấy auctionUid từ URL (fallback nếu không có param đặt tên UID)
    const { UID } = useParams();
    const auctionUid =
        UID || (typeof window !== 'undefined'
        ? window.location.pathname.split('/').filter(Boolean).pop()
        : '');

    // const numPrice = Number(currentPrice) || 0;
    // const numInc   = Number(bidIncrement) || 0;
    // const suggestedBids = [1,2,3,4].map(k => numPrice + numInc * k);

    // Tính bằng cents để tránh sai số dấu chấm động
    const priceC = toCents(currentPrice || 0);   // currentPrice -> int
    const incC   = toCents(bidIncrement || 0);   // bidIncrement -> int

    // Gợi ý giá: quy về number khi hiển thị
    const suggestedBids = [1,2,3,4].map(k => fromCents(priceC + incC * k));

    const handleBidSubmit = async (e) => {
        e?.preventDefault?.();
        const amount = parseBid(bidValue);
        // const min = numPrice + numInc;

        if (!Number.isFinite(amount) || amount <= 0) {
            alert('Vui lòng nhập số hợp lệ.');
            return;
        }

        // So sánh bằng cents (int) để tránh .0000001
        const amountC = toCents(amount);
        const minC    = priceC + incC;

        if (amountC < minC) {
            alert(`Giá của bạn phải ≥ ${fromCents(minC).toLocaleString('vi-VN')} đ`);
            return;
        }
        if (!ci || !co) {
            alert('Vui lòng chọn ngày nhận/trả phòng.');
            return;
        }
        if (new Date(co) <= new Date(ci)) {
            alert('Ngày trả phòng phải sau ngày nhận phòng.');
            return;
        }
        if (!overlapsStay(ci, co, stayPeriodStart, stayPeriodEnd)) {
            alert(
                `Khoảng ngày bạn chọn không trùng (một phần hoặc toàn bộ) với khoảng lưu trú của phiên: ` +
                `${toDMY(stayPeriodStart)} - ${toDMY(stayPeriodEnd)}.\n` +
                `Hãy chọn khoảng có ít nhất 1 đêm nằm trong khoảng trên.`
            );
            return;
        }

        // lấy userId
        const userData = JSON.parse(sessionStorage.getItem('userData') || 'null');
        const userId = userData?.id || userData?.userId;
        if (!userId) {
            alert('Bạn cần đăng nhập để đặt giá.');
            return;
        }

        try {
            setSubmitting(true);
            // ưu tiên handler từ AuctionPage để refresh dữ liệu
            if (typeof onSubmit === 'function') {
                await onSubmit(amount, { checkin: ci, checkout: co });
            } else {
                await auctionApi.bid(auctionUid, { userId, amount, checkin: ci, checkout: co });
            }
            setBidValue('');
        } catch (err) {
            alert(err?.message || 'Đặt giá thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBuyNow = async (e) => {
        e?.preventDefault?.();
        if (!ci || !co) return alert('Vui lòng chọn ngày nhận/trả phòng.');
        if (new Date(co) <= new Date(ci)) return alert('Ngày trả phòng phải sau ngày nhận phòng.');

        if (!overlapsStay(ci, co, stayPeriodStart, stayPeriodEnd)) {
            alert(
                `Khoảng ngày bạn chọn không trùng (một phần hoặc toàn bộ) với khoảng lưu trú của phiên: ` +
                `${toDMY(stayPeriodStart)} - ${toDMY(stayPeriodEnd)}.\n` +
                `Hãy chọn khoảng có ít nhất 1 đêm nằm trong khoảng trên.`
            );
            return;
        }

        // yêu cầu đăng nhập giống luồng đặt giá
        const userData = JSON.parse(sessionStorage.getItem('userData') || 'null');
        const userId = userData?.id || userData?.userId;
        if (!userId) return alert('Bạn cần đăng nhập để thuê ngay.');

        if (!window.confirm(`Kết thúc phiên và thuê ngay với khoảng ngày đã chọn?\nMức giá thuê ngay trong phiên là ${formatCurrencyVi(basePrice)} VNĐ`)) return;

        try {
            setSubmitting(true);
            // Gọi parent để parent quyết định API (buy-now)
            await onBuyNow?.({ checkin: ci, checkout: co });
        } catch (err) {
            alert(err?.message || 'Thuê ngay thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bidding-form">
            <div className='bidding-form-title'>
                <img src={DownIcon} alt="Down Icon" className="bid-down-icon" />
                <h4>Đặt giá ngay</h4>
            </div>
            <div className="current-price-display">
                <p>Giá hiện tại:</p>
                <span>{currentPrice.toLocaleString('vi-VN')} đ</span>
            </div>
            {/* NHẬN/TRẢ PHÒNG */}
            <div className="bid-dates">
                <div className="date-field">
                    <label>Ngày nhận phòng</label>
                    <input
                        class="bidding-form-date-inputs"
                        type="date"
                        value={ci || ''}
                        min={new Date().toISOString().slice(0,10)}
                        onChange={(e) => {
                        const v = e.target.value;
                        setCi(v);
                        onChangeDates?.(v, co);
                        if (co && co < v) setCo('');
                        }}
                        disabled={isEnded}
                    />
                </div>
                <div className="date-field">
                    <label>Ngày trả phòng</label>
                    <input
                        class="bidding-form-date-inputs"
                        type="date"
                        value={co || ''}
                        min={ci ? new Date(new Date(ci).getTime()+86400000).toISOString().slice(0,10) : new Date().toISOString().slice(0,10)}
                        onChange={(e) => {
                        const v = e.target.value;
                        if (!ci || new Date(v) > new Date(ci)) {
                            setCo(v);
                            onChangeDates?.(ci, v);
                        }
                        }}
                        disabled={isEnded}
                    />
                </div>
            </div>
            <div className="suggested-bids">
                {suggestedBids.map((price, i) => {
                    const p = Math.round(price * 100) / 100; // làm tròn 2 chữ số
                    return (
                    <button
                        key={i}
                        onClick={() => {
                        // Chọn 1 trong 2 cách, cả hai đều OK vì bidValue là string:
                        // 1) Hiển thị đã format ngay:
                        setBidValue(formatCurrencyVi(p));
                        // 2) Hoặc để raw rồi format khi blur:
                        // setBidValue(String(p));
                        }}
                        disabled={isEnded}
                    >
                        {p.toLocaleString('vi-VN')} đ
                    </button>
                    );
                })}
            </div>

            <div className="bid-input-container">
                <input
                    className="bid-input"
                    type="text"
                    inputMode="decimal"
                    value={focused ? unformatForEdit(bidValue) : (bidValue ? formatCurrencyVi(parseBid(bidValue)) : '')}
                    onChange={(e) => {
                        // cho phép số + , .
                        let v = e.target.value.replace(/[^0-9.,]/g, '');
                        // chỉ giữ 1 dấu thập phân
                        v = v.replace(/([.,].*?)[.,]/g, '$1');
                        // giới hạn tối đa 2 số phần thập phân
                        const m = v.match(/^([^.,]*)([.,]?)(\d{0,2}).*$/);
                        if (m) v = m[1] + m[2] + m[3];
                        setBidValue(v); // luôn string
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
                <button className="submit-bid-button" onClick={handleBidSubmit} disabled={isEnded || submitting}>
                     {isEnded ? 'Đã kết thúc' : 'Đặt giá'}
                </button>

                <button
                    className="buy-now-button"
                    onClick={handleBuyNow}
                    disabled={isEnded || submitting || !ci || !co}
                    title={!ci || !co ? 'Chọn ngày nhận/trả phòng trước' : 'Thuê ngay và kết thúc phiên'}
                >
                    Thuê ngay
                </button>
            </div>
        </div>
    );
};

export default BiddingForm;