import React from 'react';
import './AuctionHistory.css';
import DownIcon from '../../assets/down.png';

const AuctionHistory = ({ title, bids }) => {
    return (
        <div className="auction-history">
            <div className='auction-history-title'>
                <img src={DownIcon} alt="Down Icon" className="down-icon" />
                <h3>{title}</h3>
            </div>
            <table className="auction-history-table">
                <thead>
                    <tr>
                        <th>Thời gian</th>
                        <th>Người đấu giá</th>
                        <th>Giá đấu</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {bids.map(bid => (
                        <tr key={bid.id}>
                            <td>{bid.time}</td>
                            <td>{bid.bidder}</td>
                            <td>{bid.price.toLocaleString('vi-VN')} đ</td>
                            <td>
                                <span className={`status ${bid.status === 'Đang dẫn đầu' ? 'status-leading' : 'status-outbid'}`}>
                                    {bid.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AuctionHistory;