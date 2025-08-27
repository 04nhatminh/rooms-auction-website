import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AuctionPage.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import AuctionTitle from '../../components/AuctionTitle/AuctionTitle';
import ImageGallery from '../../components/ImageGallery/ImageGallery';
import productApi from '../../api/productApi';
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
    const imagesArr = Array.isArray(room?.Images ?? room?.images)
        ? (room.Images ?? room.images)
        : (room?.ImageUrls ?? room?.imageUrls ?? []);
 
    const productUid = auction.ProductUID || auction.productUid || room.ProductUID || room.productUid || '';

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
        imagesArr,
        productUid,
        auctionDetails,
        roomInfo,
        fullHistory: full,
        personalHistory: personal,
        __raw: { auction, room, fullHistory },
    };
}

function normalizeImages(arr) {
    const a = Array.isArray(arr) ? arr : [];
    return a
        .map(x => {
        if (typeof x === 'string') return x;
        return x?.url || x?.Url || x?.imageUrl || x?.ImageUrl || x?.path || '';
        })
        .filter(Boolean);
}

async function loadAuction(auctionUid, currentUserId, signal) {
    const resp = await auctionApi.getByUid(auctionUid, signal);
    const mapped = mapApiToView(resp, currentUserId);

    // Fallback ảnh phòng nếu phiên chưa có ảnh
    if ((!mapped.imagesArr || mapped.imagesArr.length === 0) && mapped.productUid) {
        try {
        const roomRes = await productApi.getRoomByUID(mapped.productUid, signal);
        const more = roomRes?.data?.images ?? roomRes?.data?.Images ?? [];
        mapped.imagesArr = Array.isArray(more) ? more : [];   // ✅ GIỮ NGUYÊN OBJECT
        } catch (e) {
        if (e.name !== 'AbortError') console.warn(e);
        }
    }
    return mapped;
}

const AuctionPage = () => {
    const params = useParams();
    const navigate = useNavigate();
    const auctionUid =
        params.UID ||
        (typeof window !== 'undefined'
            ? window.location.pathname.split('/').filter(Boolean).pop()
            : '');
    const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const qsCheckin  = qs?.get('checkin')  || '';
    const qsCheckout = qs?.get('checkout') || '';
    const buildQuery = (ci, co) => {
        const search = new URLSearchParams();
        if (ci) search.set('checkin', ci);
        if (co) search.set('checkout', co);
        return search.toString();
    };
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewData, setViewData] = useState(null);
    const [userCheckin, setUserCheckin] = useState(qsCheckin);
    const [userCheckout, setUserCheckout] = useState(qsCheckout);
    const [, setAuctionDetails] = useState(null);
    const [isEnded, setIsEnded] = useState(false);
    const [hasEndedCalled, setHasEndedCalled] = useState(false);

    const currentUserId = useMemo(() => {
        try {
            const userData = JSON.parse(sessionStorage.getItem('userData') || 'null');
            return userData?.id || userData?.userId || null;
        } catch { return null; }
    }, []);

    useEffect(() => {
        const aborter = new AbortController();
        let alive = true;
        setLoading(true); setError('');

        loadAuction(auctionUid, currentUserId, aborter.signal)
            .then(mapped => {
                if (alive) {
                    setViewData(mapped);
                    // Nếu trạng thái phiên là ended thì disable nút Đặt giá
                    if (mapped?.auctionDetails?.status === 'ended') setIsEnded(true);
                }
            })
            .catch(e => { if (alive && e.name !== 'AbortError') setError(e.message || 'Không tải được dữ liệu phiên'); })
            .finally(() => { if (alive) setLoading(false); });

        return () => { alive = false; aborter.abort(); };
    }, [auctionUid, currentUserId]);

    useEffect(() => {
        let timer;
        const fetchAuction = async () => {
            try {
                const mapped = await loadAuction(auctionUid, currentUserId);
                setViewData(mapped);
                if (mapped?.auctionDetails?.status === 'ended') setIsEnded(true);
            } catch (e) {}
        };
        timer = setInterval(fetchAuction, 5000); // 5s
        return () => clearInterval(timer);
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

    const { imagesArr, auctionDetails, roomInfo, fullHistory, personalHistory, title } = viewData;
    const images = imagesArr; // alias cho dễ đọc ở dưới

    console.log('auctioninfo', auctionDetails);

    return (
        <div className="auction-page-container">
            <Header />
            <main className="auction-main-content">
                {/* Giữ nguyên UI/format của AuctionPage cũ */}
                <AuctionTitle title={title} />
                <div className="auction-layout-grid">
                    <div className="left-column">
                        <ImageGallery images={images} />
                    </div>

                    <div className="right-column auction-info-card">
                        <CountdownTimer
                            details={auctionDetails}
                            onEnded={async () => {
                                if (hasEndedCalled) return; // Đã gọi rồi thì bỏ qua
                                setHasEndedCalled(true);
                                setIsEnded(true);
                                setAuctionDetails(prev => ({ ...prev, status: 'ended' }));
                                try {
                                  await auctionApi.endAuction(auctionUid); // Gọi API chuyển trạng thái về ended
                                } catch (e) {
                                  console.error('Lỗi khi kết thúc phiên:', e);
                                }
                              }}
                        />
                        <AuctionInfo details={auctionDetails} />
                        <BiddingForm
                            currentPrice={auctionDetails?.currentPrice}
                            bidIncrement={auctionDetails?.bidIncrement}
                            checkin={userCheckin}
                            checkout={userCheckout}
                            status={auctionDetails?.status}
                            isEnded={isEnded}
                            onChangeDates={(ci, co) => { setUserCheckin(ci); setUserCheckout(co); }}
                            onSubmit={async (amount, { checkin, checkout }) => {
                                try {
                                    if (!currentUserId) throw new Error('Bạn cần đăng nhập để đặt giá');
                                    await auctionApi.bid(auctionUid, {
                                    userId: currentUserId,
                                    amount,
                                    checkin: checkin  || userCheckin,
                                    checkout: checkout || userCheckout,
                                    });
                                    const mapped = await loadAuction(auctionUid, currentUserId); // ← dùng lại fallback ảnh
                                    setViewData(mapped);
                                } catch (e) {
                                    alert(e.message || 'Đặt giá thất bại');
                                }
                            }}
                            onBuyNow={async ({ checkin, checkout }) => {
                                try {
                                    if (!currentUserId) throw new Error('Bạn cần đăng nhập để thuê ngay');
                                    const r = await auctionApi.buyNow(auctionUid, {
                                        userId: currentUserId,
                                        checkin: checkin  || userCheckin,
                                        checkout: checkout || userCheckout,
                                    });
                                    // Điều hướng sang trang Checkout như BookingCard
                                    const paramsQ = buildQuery(checkin || userCheckin, checkout || userCheckout);
                                    navigate(`/checkout/booking/${r.bookingId}${paramsQ ? `?${paramsQ}` : ''}`, {
                                        state: {
                                            // nếu bạn có state khách trên trang này thì truyền đúng số; tạm thời để mặc định 1
                                            guests: { adults: 1, children: 0, infants: 0 },
                                            totalGuests: 1,
                                            bookingId: r.bookingId,
                                            holdExpiresAt: r.holdExpiresAt,
                                            source: 'auction_buy_now',
                                        },
                                    });
                                    // Reload phiên để reflect: status=ended, currentPrice có thể thay đổi, lịch sử cập nhật, v.v.
                                    const mapped = await loadAuction(auctionUid, currentUserId);
                                    setViewData(mapped);
                                    alert('Thuê ngay thành công! Phiên đã kết thúc.');
                                } catch (e) {
                                    // Map thông điệp để tránh lộ chi tiết
                                    let msg = 'Không thể thuê ngay. Vui lòng chọn khoảng thời gian khác.';
                                    const t = e.message || '';
                                    if (t.includes('giữ/chặn') || t.includes('trùng lịch')) {
                                        msg = 'Khoảng thời gian bạn chọn hiện không khả dụng. Vui lòng chọn ngày khác.';
                                    }
                                    alert(msg);
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="bottom-sections">
                    <AuctionRoomDetails info={roomInfo} />
                    <AuctionHistory title="Lịch sử đấu giá toàn phòng" bids={fullHistory} />    
                    <PolicySections />
                </div>
            </main>
            <Footer />
        </div>
    );
};


export default AuctionPage;

