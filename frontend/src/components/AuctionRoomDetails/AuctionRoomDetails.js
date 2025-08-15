import React from 'react';
import './AuctionRoomDetails.css';
import DownIcon from '../../assets/down.png';

const AuctionRoomDetails = ({ info }) => {
    return (
        <div className="auction-room-details">
            <div className="auction-room-details-header">
                <div className='auction-room-details-title'>
                    <img src={DownIcon} alt="Down Icon" className="down-icon" />
                    <h3>Thông tin phòng</h3>
                </div>
                <span className="auction-room-details-see-more">Xem thêm</span>
            </div>

            <div className="auction-room-details-content">
                <div className="auction-room-details-content-group">
                    <p><strong>Tên phòng:</strong> {info.type}</p>
                    <p><strong>Loại phòng:</strong> {info.type}</p>
                    <p><strong>Số lượng phòng:</strong> {info.capacity}</p>
                    <p><strong>Địa chỉ:</strong> {info.location}</p>
                </div>
                <div className="auction-room-details-content-group">
                    <p><strong>Khoảng thời gian lưu trú áp dụng:</strong> {info.stayDuration}</p>
                    <p><strong>Số đêm tối thiểu có thể đặt:</strong> {info.minStay}</p>
                    <p><strong>Số đêm tối đa có thể đặt:</strong> {info.maxStay}</p>
                    <p><strong>Chính sách checkin/checkout:</strong> {info.checkinCheckoutPolicy}</p>
                </div>

            </div>
        </div>
    );
};

export default AuctionRoomDetails;