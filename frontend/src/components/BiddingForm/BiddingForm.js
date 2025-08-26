import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import auctionApi from '../../api/auctionApi';
import './BiddingForm.css';
import DownIcon from '../../assets/down.png';



const BiddingForm = ({ currentPrice, bidIncrement, checkin, checkout, onChangeDates, onSubmit }) => {
    const [bidValue, setBidValue] = useState('');
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

    const numPrice = Number(currentPrice) || 0;
    const numInc   = Number(bidIncrement) || 0;
    const suggestedBids = [1,2,3,4].map(k => numPrice + numInc * k);

    const handleBidSubmit = async (e) => {
        e?.preventDefault?.();
        const amount = Number(String(bidValue).replace(/\D/g, ''));
        const min = numPrice + numInc;
        if (!Number.isFinite(amount) || amount <= 0) {
            alert('Vui lòng nhập số hợp lệ.');
            return;
        }
        if (amount < min) {
            alert(`Giá của bạn phải ≥ ${min.toLocaleString('vi-VN')} đ`);
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
                        type="date"
                        value={ci || ''}
                        min={new Date().toISOString().slice(0,10)}
                        onChange={(e) => {
                        const v = e.target.value;
                        setCi(v);
                        onChangeDates?.(v, co);
                        if (co && co < v) setCo('');
                        }}
                    />
                </div>
                <div className="date-field">
                    <label>Ngày trả phòng</label>
                    <input
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
                    />
                </div>
            </div>
            <div className="suggested-bids">
                {suggestedBids.map((price, index) => (
                    <button key={index} onClick={() => setBidValue(price)}>
                        {price.toLocaleString('vi-VN')} đ
                    </button>
                ))}
            </div>

            <div className="bid-input-container">
                <input
                    type="text"
                    value={String(bidValue).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                    onChange={(e) => setBidValue(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Nhập giá của bạn"
                    className="bid-input"
                />
                <button className="submit-bid-button" onClick={handleBidSubmit} disabled={submitting}>
                    Đặt giá
                </button>
            </div>
        </div>
    );
};

export default BiddingForm;