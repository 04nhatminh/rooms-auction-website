import React, { useEffect, useMemo, useState } from 'react';
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

function fmtDate(d) {
    try {
        const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        const hh = String(date.getHours()).padStart(2, '0');
        const mi = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return { dmy: `${dd}/${mm}/${yyyy}`, hms_dmy: `${hh}:${mi}:${ss} - ${dd}/${mm}/${yyyy}` };
    } catch (_) {
        return { dmy: '', hms_dmy: '' };
    }
}

function maskBidder(nameOrId) {
    if (!nameOrId) return '***';
    const s = String(nameOrId);
    if (s.length <= 3) return `${s[0]}**`;
    return `${s.slice(0, 3)}***${s.slice(-3)}`;
}

// Map payload từ API sang đúng format UI hiện tại của AuctionPage mock
function mapApiToView(payload, currentUserId) {
    const { auction = {}, room = {}, fullHistory = [] } = payload?.data || {};

    // Ảnh
    const imageList = Array.isArray(room?.Images || room?.images)
    ? (room.Images || room.images)
    : (room.ImageUrls || room.imageUrls || []);
    const images = {
        main: imageList?.[0] || room?.CoverImage || room?.coverImage || '',
        thumbnails: imageList?.slice(0, 3) || [],
        moreCount: Math.max(0, (imageList?.length || 0) - 3),
    };

    // Chi tiết phiên
    const start = auction.StartTime || auction.startTime || auction.start || auction.start_date || auction.Checkin || auction.checkin;
    const end = auction.EndTime || auction.endTime || auction.end || auction.end_date;
    const stayStart = auction.Checkin || auction.checkin || auction.StayStart || auction.stayStart;
    const stayEnd = auction.Checkout || auction.checkout || auction.StayEnd || auction.stayEnd;
    const { dmy: stayStartDMY } = fmtDate(stayStart);
    const { dmy: stayEndDMY } = fmtDate(stayEnd);
    const { hms_dmy: startFmt } = fmtDate(start);
    const { hms_dmy: endFmt } = fmtDate(end);

    const auctionDetails = {
        endDate: end ? new Date(end) : undefined,
        stayPeriod: stayStartDMY && stayEndDMY ? `${stayStartDMY} - ${stayEndDMY}` : '',
        startTime: startFmt,
        endTime: endFmt,
        duration: (() => {
            const s = start ? new Date(start) : null;
            const e = end ? new Date(end) : null;
            if (!s || !e) return '';
            const ms = Math.max(0, e - s);
            const days = Math.ceil(ms / (24 * 3600 * 1000));
            return `${days} ngày`;
        })(),
        bidIncrement: auction.BidIncrement || auction.bidIncrement || 0,
        startingPrice: auction.StartingPrice || auction.startingPrice || 0,
        currentPrice: auction.CurrentPrice || auction.currentPrice || auction.lastPrice || auction.startingPrice || 0,
        currency: auction.Currency || auction.currency || 'VND',
        status: auction.Status || auction.status || 'active',
    };

    // Thông tin phòng
    const roomInfo = {
        type: room?.PropertyTypeLabel || room?.type || 'Phòng/ căn hộ',
        capacity:
        room?.CapacityLabel ||
        `${room?.livingRooms || 0} phòng khách - ${room?.bedrooms || 0} phòng ngủ - ${room?.beds || 0} giường - ${room?.bathrooms || 0} phòng tắm`,
        location: room?.LocationLabel || room?.location || [room?.DistrictName, room?.ProvinceName, room?.CountryName].filter(Boolean).join(', '),
        title: room?.Title || room?.name || auction?.Title || '',
    };

    // Lịch sử đấu giá
    const full = (fullHistory || []).map((b, i) => ({
        id: b.id || b.BidID || i + 1,
        time: fmtDate(b.BidTime || b.time || b.CreatedAt || b.createdAt).hms_dmy, // dùng BidTime
        bidder: maskBidder(b.FullName || b.userName || b.UserName || b.userId || b.UserID),
        price: Number(b.Amount ?? b.amount ?? b.BidAmount ?? 0),
        status: i === 0 ? 'Đang dẫn đầu' : 'Đã bị vượt',
    }));
    const personal = full.filter((b) => {
        const rawUser = fullHistory.find((h) => (h.userId ?? h.UserID) === currentUserId);
        return rawUser ? (b.bidder === maskBidder(rawUser.userId || rawUser.UserID)) : false;
    });

    return {
        title: roomInfo.title || 'Phiên đấu giá',
        images,
        auctionDetails,
        roomInfo,
        fullHistory: full,
        personalHistory: personal,
        __raw: { auction, room, fullHistory },
    };
}

const AuctionPage = () => {
    const params = useParams();
    const auctionUid =
        params.UID ||
        (typeof window !== 'undefined'
            ? window.location.pathname.split('/').filter(Boolean).pop()
            : '');
    const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const qsCheckin  = qs?.get('checkin')  || '';
    const qsCheckout = qs?.get('checkout') || '';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewData, setViewData] = useState(null);
    const [userCheckin, setUserCheckin] = useState(qsCheckin);
    const [userCheckout, setUserCheckout] = useState(qsCheckout);
    const [auctionDetailsState, setAuctionDetails] = useState(null);

    const currentUserId = useMemo(() => {
        try {
            const userData = JSON.parse(sessionStorage.getItem('userData') || 'null');
            return userData?.id || userData?.userId || null;
        } catch { return null; }
    }, []);

    useEffect(() => {
        const aborter = new AbortController();
        let alive = true;

        setLoading(true);
        setError('');

        auctionApi.getByUid(auctionUid, aborter.signal)
            .then((resp) => {
                if (!alive || !resp) return;
                const mapped = mapApiToView(resp, currentUserId);
                setViewData(mapped);
                setAuctionDetails(mapped.auctionDetails); // cập nhật state auctionDetailsState
                // Nếu chưa có từ query thì fallback từ dữ liệu phiên
                const raw = resp?.data?.auction || {};
                const toYMD = (d) => (d ? new Date(d).toISOString().slice(0,10) : '');
                if (!qsCheckin  && !userCheckin)  setUserCheckin(toYMD(raw.Checkin  || raw.checkin));
                if (!qsCheckout && !userCheckout) setUserCheckout(toYMD(raw.Checkout || raw.checkout));
            })
            .catch((e) => {
                if (!alive) return;
                if (e.name === 'AbortError') return;       // <-- bỏ qua abort
                setError(e.message || 'Không tải được dữ liệu phiên');
            })
            .finally(() => {
                if (alive) setLoading(false);
            });

        return () => {
            alive = false;
            aborter.abort();
        };
    }, [auctionUid, currentUserId]);


    if (loading) {
        return (
            <div className="auction-page-container">
                <Header />
                <main className="auction-main-content"><div className="loading">Đang tải phiên đấu giá…</div></main>
                <Footer />
            </div>
        );
    }

    if (error || !viewData) {
        return (
            <div className="auction-page-container">
                <Header />
                <main className="auction-main-content"><div className="error">{error || 'Không có dữ liệu phiên'}</div></main>
                <Footer />
            </div>
        );
    }

    const { images, auctionDetails, roomInfo, fullHistory, personalHistory, title } = viewData;

    console.log('images',images);

    return (
        <div className="auction-page-container">
            <Header />
            <main className="auction-main-content">
                {/* Giữ nguyên UI/format của AuctionPage cũ */}
                <AuctionTitle title={title} />
                <div className="auction-layout-grid">
                    <div className="left-column">
                        <AuctionImageGallery images={images} />
                    </div>

                    <div className="right-column auction-info-card">
                            <CountdownTimer
                                details={auctionDetailsState}
                                onEnded={async () => {
                                    if (auctionDetailsState?.status !== 'ended' && auctionUid) {
                                        try {
                                            await auctionApi.endAuction(auctionUid);
                                            setAuctionDetails(prev => ({ ...prev, status: 'ended' }));
                                        } catch (e) {
                                            // Có thể log hoặc báo lỗi nếu cần
                                        }
                                    }
                                }}
                            />
                            <AuctionInfo details={auctionDetailsState} />
                            <BiddingForm
                                    currentPrice={auctionDetailsState?.currentPrice}
                                    bidIncrement={auctionDetailsState?.bidIncrement}
                                    checkin={userCheckin}
                                    checkout={userCheckout}
                                    status={auctionDetailsState?.status}
                                    onChangeDates={(ci, co) => { setUserCheckin(ci); setUserCheckout(co); }}
                                    // Truyền thêm thông tin cần thiết cho submit bid
                                    oonSubmit={async (amount, { checkin, checkout }) => {
                                            try {
                                                    if (!currentUserId) throw new Error('Bạn cần đăng nhập để đặt giá');
                                    await auctionApi.bid(auctionUid, {
                                        userId: currentUserId,
                                        amount,
                                        checkin: checkin  || userCheckin,
                                        checkout: checkout || userCheckout,
                                    });
                                    // Sau khi bid thành công, refresh dữ liệu
                                    const refreshed = await auctionApi.getByUid(auctionUid);
                                    setViewData(mapApiToView(refreshed, currentUserId));
                                } catch (e) {
                                    alert(e.message || 'Đặt giá thất bại');
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="bottom-sections">
                    <AuctionRoomDetails info={roomInfo} />
                    <AuctionHistory title="Lịch sử đấu giá toàn phòng" bids={fullHistory} />
                    <AuctionHistory title="Lịch sử đấu giá cá nhân" bids={personalHistory} />
                    <PolicySections />
                </div>
            </main>
            <Footer />
        </div>
    );
};


export default AuctionPage;

