import React from 'react';
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

// Dữ liệu giả lập (mock data) - Trong thực tế sẽ lấy từ API
const auctionData = {
    title: 'Leo House - The Song Building (Angia)',
    images: {
        main: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQeJQeJyzgAzTEVqXiGe90RGBFhfp_4RcJJMQ&s',
        thumbnails: [
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQeJQeJyzgAzTEVqXiGe90RGBFhfp_4RcJJMQ&s',
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQeJQeJyzgAzTEVqXiGe90RGBFhfp_4RcJJMQ&s',
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQeJQeJyzgAzTEVqXiGe90RGBFhfp_4RcJJMQ&s',
        ],
        moreCount: 10,
    },
    auctionDetails: {
        endDate: new Date(new Date().getTime() + 2.5 * 3600 * 1000), // Ví dụ: còn lại 1h30p
        stayPeriod: '01/09/2025 - 15/09/2025',
        startTime: '23:00:00 - 08/08/2025',
        endTime: '23:00:00 - 14/08/2025',
        duration: '7 ngày',
        bidIncrement: 50000,
        startingPrice: 1000000,
        currentPrice: 2000000,
    },
    roomInfo: {
        type: 'Toàn bộ căn hộ cho thuê',
        capacity: '2 phòng khách - 1 phòng ngủ - 1 giường - 1 phòng tắm',
        location: 'Vũng Tàu, Việt Nam',
    },
    fullHistory: [
        { id: 1, time: '08/08/2025', bidder: 'Meo***meo', price: 1000000, status: 'Bị vượt giá' },
        { id: 2, time: '10/08/2025', bidder: 'Tui***tui', price: 1500000, status: 'Bị vượt giá' },
        { id: 3, time: '13/08/2025', bidder: 'Meo***meo', price: 2000000, status: 'Đang dẫn đầu' },
    ],
    personalHistory: [
        { id: 1, time: '08/08/2025', bidder: 'Meo***meo', price: 1000000, status: 'Bị vượt giá' },
        { id: 2, time: '13/08/2025', bidder: 'Meo***meo', price: 2000000, status: 'Đang dẫn đầu' },
    ]
};

const AuctionPage = () => {
    return (
        <div className="auction-page-container">
            <Header />
            <main className="auction-main-content">
                <AuctionTitle />
                <div className="auction-layout-grid">
                    <div className="left-column">
                        <AuctionImageGallery images={auctionData.images} />
                    </div>
                    <div className="right-column auction-info-card">
                        <CountdownTimer details={auctionData.auctionDetails} />
                        <AuctionInfo details={auctionData.auctionDetails} />
                        <BiddingForm currentPrice={auctionData.auctionDetails.currentPrice} bidIncrement={auctionData.auctionDetails.bidIncrement} />
                    </div>
                </div>
                <div className="bottom-sections">
                    <AuctionRoomDetails info={auctionData.roomInfo} />
                    <AuctionHistory title="Lịch sử đấu giá toàn phòng" bids={auctionData.fullHistory} />
                    <AuctionHistory title="Lịch sử đấu giá cá nhân" bids={auctionData.personalHistory} />
                    <PolicySections />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AuctionPage;