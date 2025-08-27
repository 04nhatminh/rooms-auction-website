import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AuctionRoomDetails.css';
import DownIcon from '../../assets/down.png';

const AuctionRoomDetails = ({ info }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const handleSeeMore = async () => {
        if (!info?.roomUID) return;
        navigate(`/room/${info.roomUID}`);
    };

    return (
        <div className="auction-room-details">
            <div className="auction-room-details-header">
                <div className='auction-room-details-title'>
                    <img src={DownIcon} alt="Down Icon" className="down-icon" />
                    <h3>Thông tin phòng</h3>
                </div>
                <button
                    className="auction-room-details-see-more"
                    onClick={handleSeeMore}
                    type="button"
                >
                    Xem thêm
                </button>
            </div>

            <div className="auction-room-details-content">
                <div className="auction-room-details-content-group">
                    <p><strong>Tên phòng:</strong> {info.title}</p>
                    <p><strong>Loại phòng:</strong> {info.roomType}</p>
                    <p><strong>Số khách tối đa (chỉ tính người lớn và trẻ em):</strong> {info.maxGuests} người</p>
                    <p><strong>Hình thức chỗ ở:</strong> {info.propertyType}</p>
                </div>
                <div className="auction-room-details-content-group">
                    <p><strong>Khoảng thời gian lưu trú của phiên hiện tại:</strong> {info.stayPeriod}</p>
                    <p><strong>Số đêm tối thiểu có thể đặt:</strong> 1</p>
                    <p><strong>Số đêm tối đa có thể đặt:</strong> Không giới hạn</p>
                    <p><strong>Địa chỉ:</strong> {info.location}</p>
                </div>

            </div>
        </div>
    );
};

export default AuctionRoomDetails;