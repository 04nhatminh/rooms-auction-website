// src/pages/AuctionPage/AuctionPage.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import './AuctionPage.css';

import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import AuctionTitle from '../../components/AuctionTitle/AuctionTitle';
import AuctionImageGallery from '../../components/AuctionImageGallery/AuctionImageGallery';
import CountdownTimer from '../../components/CountdownTimer/CountdownTimer';
import AuctionInfo from '../../components/AuctionInfo/AuctionInfo';
import BiddingForm from '../../components/BiddingForm/BiddingForm';
import AuctionRoomDetails from '../../components/AuctionRoomDetails/AuctionRoomDetails';
import AuctionHistory from '../../components/AuctionHistory/AuctionHistory';
import PolicySections from '../../components/PolicySections/PolicySections';

import auctionApi from '../../api/auctionApi';
import AuthPopup from '../../components/AuthPopup/AuthPopup';

// ------- helpers -------
function maskName(name) {
    if (!name) return 'Ẩn danh';
    const s = String(name).trim();
    if (s.length <= 3) return s[0] + '***';
    const head = s.slice(0, 3);
    const tail = s.slice(-2);
    return `${head}***${tail}`;
}

function fmtDateTime(dt) {
    const d = new Date(dt);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mi}:${ss} - ${dd}/${mm}/${yyyy}`;
}

function daysBetween(a, b) {
    const A = new Date(a), B = new Date(b);
    return Math.max(0, Math.ceil((B - A) / 86400000));
}

function formatStayRange(startISO, endISO, withNights = true) {
    if (!startISO || !endISO) return '';

    const s = new Date(startISO); // tự đổi sang giờ local
    const e = new Date(endISO);   // [start, end) — end là ngày trả phòng

    const pad = (n) => String(n).padStart(2, '0');

    const sY = s.getFullYear(), sM = s.getMonth() + 1, sD = s.getDate();
    const eY = e.getFullYear(), eM = e.getMonth() + 1, eD = e.getDate();

    let label;
    if (sY === eY && sM === eM) {
        // Cùng tháng/năm → "10–13/09/2025"
        label = `${pad(sD)}–${pad(eD)}/${pad(sM)}/${sY}`;
    } else if (sY === eY) {
        // Khác tháng, cùng năm → "28/09–02/10/2025"
        label = `${pad(sD)}/${pad(sM)}–${pad(eD)}/${pad(eM)}/${sY}`;
    } else {
        // Khác năm → "30/12/2025–02/01/2026"
        label = `${pad(sD)}/${pad(sM)}/${sY}–${pad(eD)}/${pad(eM)}/${eY}`;
    }

    if (withNights) {
        const nights = Math.max(0, Math.round((e - s) / 86400000));
        label += ` (${nights} đêm)`;
    }
    return label;
}

export default function AuctionPage() {
    // Chấp nhận nhiều tên param để tránh lệch router
    const params = useParams();
    const auctionUid = params.auctionUid ?? params.UID ?? params.id ?? params.auctionId;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [auction, setAuction] = useState(null);   // { endTime, startTime, stayPeriod, startPrice, bidIncrement, currentPrice, status ... }
    const [room, setRoom] = useState(null);         // { name, currency, basePrice }
    const [history, setHistory] = useState([]);     // [{ BidID, Amount, BidTime, FullName }]

    const [showLogin, setShowLogin] = useState(false);

    // lấy current userId từ session/local
    const currentUserId = useMemo(() => {
        try {
        const s = JSON.parse(sessionStorage.getItem('userData') || 'null') || JSON.parse(localStorage.getItem('userData') || 'null');
        return s?.id ?? s?.userId ?? null;
        } catch { return null; }
    }, []);

    // gọi API lấy phiên
    const refresh = useCallback(async () => {
        if (!auctionUid) { setError('Thiếu Auction UID'); return; }
        setLoading(true);
        setError('');
        try {
        const r = await auctionApi.getByUid(auctionUid);
        const d = r?.data || {};
        setAuction(d.auction || null);
        setRoom(d.room || null);
        setHistory(Array.isArray(d.fullHistory) ? d.fullHistory : []);
        } catch (e) {
        setError(e?.message || 'Không tải được phiên đấu giá');
        } finally {
        setLoading(false);
        }
    }, [auctionUid]);

    useEffect(() => { refresh(); }, [refresh]);

    // countdown: truyền cho CountdownTimer theo định dạng cũ (details.endDate là Date)
    const countdownDetails = useMemo(() => {
        if (!auction) return null;
        return { endDate: new Date(auction.endTime) };
    }, [auction]);

    // map dữ liệu cho AuctionInfo (khớp props cũ)
    const infoDetails = useMemo(() => {
        if (!auction || !room) return null;
        return {
        stayPeriod: formatStayRange(auction.stayPeriod?.start, auction.stayPeriod?.end),
        startTime: fmtDateTime(auction.startTime),
        endTime: fmtDateTime(auction.endTime),
        duration: `${daysBetween(auction.startTime, auction.endTime)} ngày`,
        bidIncrement: auction.bidIncrement,
        startingPrice: auction.startPrice,
        currentPrice: auction.currentPrice,
        currency: room.currency || 'VND',
        };
    }, [auction, room]);

    // map lịch sử cho component AuctionHistory (giữ layout cũ)
    const viewFullHistory = useMemo(() => {
        if (!history || !history.length || !auction) return [];
        return history.map((b, idx) => ({
        id: b.BidID,
        time: fmtDateTime(b.BidTime),
        bidder: maskName(b.FullName),
        price: Number(b.Amount || 0),
        status: idx === 0 ? 'Đang dẫn đầu' : 'Bị vượt giá',
        }));
    }, [history, auction]);

    const personalHistory = useMemo(() => {
        if (!currentUserId || !history?.length) return [];
        const mine = history.filter(h => Number(h.UserID) === Number(currentUserId));
        return mine.map((b) => ({
        id: b.BidID,
        time: fmtDateTime(b.BidTime),
        bidder: maskName(b.FullName),
        price: Number(b.Amount || 0),
        status: b.BidID === history[0]?.BidID ? 'Đang dẫn đầu' : 'Bị vượt giá',
        }));
    }, [history, currentUserId]);

    // đặt giá
    const handleBid = useCallback(async (amount) => {
        if (!currentUserId) { setShowLogin(true); return; }
        if (!auctionUid) return;
        try {
        await auctionApi.bid(auctionUid, { userId: currentUserId, amount: Number(amount) });
        await refresh();
        } catch (e) {
        alert(e?.message || 'Đặt giá thất bại');
        }
    }, [auctionUid, currentUserId, refresh]);

    // ảnh phòng (nếu chưa có ảnh từ API, dùng rỗng/placeholder)
    const images = useMemo(() => {
        // Nếu backend sau này trả images, map vào đây. Tạm thời để rỗng => component tự xử lý.
        return { main: null, thumbnails: [], moreCount: 0 };
    }, []);

    // render
    if (!auctionUid) return <div style={{ padding: 24 }}>Sai đường dẫn: thiếu Auction UID.</div>;
    if (loading) return <div style={{ padding: 24 }}>Đang tải phiên đấu giá...</div>;
    if (error || !auction) return <div style={{ padding: 24, color: 'tomato' }}>{error || 'Không tìm thấy phiên đấu giá.'}</div>;

    return (
        <div className="auction-page-container">
        <Header />
        <main className="auction-main-content">
            <AuctionTitle />
            <div className="auction-layout-grid">
            <div className="left-column">
                <AuctionImageGallery images={images} />
            </div>

            <div className="right-column auction-info-card">
                {countdownDetails && <CountdownTimer details={countdownDetails} />}
                {infoDetails && (
                <AuctionInfo details={infoDetails} />
                )}
                {/* BiddingForm của bạn trước đây nhận currentPrice & bidIncrement.
                    Mình bổ sung thêm onBid & currency (component có thể bỏ qua nếu không dùng). */}
                <BiddingForm
                currentPrice={auction.currentPrice}
                bidIncrement={auction.bidIncrement}
                currency={room?.currency || 'VND'}
                onBid={handleBid}
                disabled={new Date(auction.endTime) <= new Date()}
                />
            </div>
            </div>

            <div className="bottom-sections">
            <AuctionRoomDetails
                info={{
                type: 'Phòng/nhà cho thuê',
                capacity: '', // nếu backend có thêm, map vào đây
                location: '', // nếu backend có thêm, map vào đây
                name: room?.name || '',
                basePrice: room?.basePrice || 0,
                currency: room?.currency || 'VND',
                }}
            />

            <AuctionHistory title="Lịch sử đấu giá toàn phòng" bids={viewFullHistory} />
            <AuctionHistory title="Lịch sử đấu giá của bạn" bids={personalHistory} />

            <PolicySections />
            </div>
        </main>

        <Footer />

        <AuthPopup
            open={showLogin}
            onClose={() => setShowLogin(false)}
            onSuccess={() => { setShowLogin(false); /* vừa login xong → user có thể bấm đặt giá lại */ }}
        />
        </div>
    );
}
