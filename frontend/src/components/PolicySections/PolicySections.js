import React from 'react';
import './PolicySections.css';
import DownIcon from '../../assets/down.png';

const PolicySections = () => {
    return (
        <>
            <div className="policies-section">
                <div className='policies-section-title'>
                        <img src={DownIcon} alt="Down Icon" className="down-icon" />
                        <h3>Quy định đấu giá</h3>
                </div>
                <ul>
                    <li>Phiên đấu giá cho phép tham gia đấu giá nếu <strong>thời gian lưu trú mong muốn có ngày trùng với khoảng thời gian lưu trú hiện tại của phiên đấu giá</strong> và giá đặt phải lớn hơn hoặc bằng tổng giá hiện tại với giá của một bước nhảy.</li>
                    <li>Người thắng đấu giá sẽ được thuê với <strong>thông tin đặt phòng giống với lượt đặt giá chiến thắng</strong> của mình.</li>
                    <li>Số đêm lưu trú tối thiểu: <strong>1 đêm</strong></li>
                    <li>Phiên đấu giá kết thúc khi hết thời gian hoặc có người thuê ngay phòng thành công trong phiên đấu giá.</li>
                    <li>Người trả giá cao nhất khi kết thúc sẽ thắng.</li>
                </ul>
            </div>
            {/* <div className="policies-section">
                <div className='policies-section-title'>
                        <img src={DownIcon} alt="Down Icon" className="down-icon" />
                        <h3>Quy định thanh toán & hủy</h3>
                </div>
                <ul>
                    <li>Thanh toán toàn bộ trong vòng <strong>24h</strong> sau khi kết thúc đấu giá.</li>
                    <li>Hủy đặt phòng sau khi thanh toán sẽ áp dụng theo chính sách hủy của khách sạn.</li>
                    <li>Trong trường hợp không thanh toán đúng hạn, quyền thắng đấu giá sẽ bị hủy.</li>
                </ul>
            </div> */}
            <div className="policies-section" style={{ paddingBottom: '0px' }}>
                <div className='policies-section-title'>
                        <img src={DownIcon} alt="Down Icon" className="down-icon" />
                        <h3>Lưu ý khác</h3>
                </div>
                <ul>
                    <li>Thời gian hiển thị trên hệ thống là giờ <strong>Việt Nam (GMT+7)</strong>.</li>
                    <li>Phiên đấu giá có thể kết thúc sớm vì lý do kỹ thuật hoặc theo quyết định quản trị viên.</li>
                    <li>Mọi hành vi gian lận hoặc thông đồng sẽ bị hủy kết quả và khóa tài khoản.</li>
                </ul>
            </div>
        </>
    );
};

export default PolicySections;