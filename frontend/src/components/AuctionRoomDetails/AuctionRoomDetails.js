import React from 'react';
import './AuctionRoomDetails.css';
import DownIcon from '../../assets/down.png';

const AuctionRoomDetails = ({ info }) => {
    console.log(info);
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