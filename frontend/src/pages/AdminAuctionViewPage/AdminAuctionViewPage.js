import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader/PageHeader';
import styles from './AdminAuctionViewPage.module.css';
import auctionApi from '../../api/auctionApi';

const AdminAuctionViewPage = () => {
    const { auctionUID } = useParams();
    const navigate = useNavigate();
    const [auction, setAuction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const formatCurrency = (price) => {
        const v = typeof price === 'number' ? price : Number(price);
        if (Number.isNaN(v)) return '-';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(v);
    };

    const fmtDateTime = (d) => {
        if (!d) return '-';
        const date = new Date(d);
        if (isNaN(date.getTime())) return String(d);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const fmtDate = (d) => {
        if (!d) return '-';
        const date = new Date(d);
        if (isNaN(date.getTime())) return String(d);
        return date.toLocaleDateString('vi-VN');
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'Đang hoạt động';
            case 'ended': return 'Đã kết thúc';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    const getEndReasonText = (endReason) => {
        switch (endReason) {
            case 'natural_end': return 'Kết thúc tự nhiên';
            case 'buy_now': return 'Mua ngay';
            case 'cancelled': return 'Bị hủy';
            case 'admin_force': return 'Admin ép kết thúc';
            default: return endReason || '-';
        }
    };

    useEffect(() => {
        const fetchAuctionDetails = async () => {
            try {
                setLoading(true);
                const response = await auctionApi.getAuctionDetailsForAdmin(auctionUID);
                
                if (response?.success) {
                    setAuction(response.data);
                } else {
                    setError('Không thể tải thông tin đấu giá');
                }
            } catch (err) {
                console.error('Error fetching auction details:', err);
                setError(err.message || 'Đã xảy ra lỗi khi tải thông tin đấu giá');
            } finally {
                setLoading(false);
            }
        };

        if (auctionUID) {
            fetchAuctionDetails();
        }
    }, [auctionUID]);

    const handleBack = () => {
        navigate('/admin/auctions-management');
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Đang tải...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.page}>
                <PageHeader
                    title="Chi tiết đấu giá"
                    crumbs={[
                        { label: 'Dashboard', to: '/admin/dashboard' },
                        { label: 'Quản lý đấu giá', to: '/admin/auctions-management' },
                        { label: 'Chi tiết đấu giá' }
                    ]}
                />
                <div className={styles.error}>Lỗi: {error}</div>
                <button onClick={handleBack} className={styles.backBtn}>Quay lại</button>
            </div>
        );
    }

    if (!auction) {
        return (
            <div className={styles.page}>
                <PageHeader
                    title="Chi tiết đấu giá"
                    crumbs={[
                        { label: 'Dashboard', to: '/admin/dashboard' },
                        { label: 'Quản lý đấu giá', to: '/admin/auctions-management' },
                        { label: 'Chi tiết đấu giá' }
                    ]}
                />
                <div className={styles.error}>Không tìm thấy đấu giá</div>
                <button onClick={handleBack} className={styles.backBtn}>Quay lại</button>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <PageHeader
                title={`Chi tiết đấu giá #${auction.AuctionUID}`}
                crumbs={[
                    { label: 'Dashboard', to: '/admin/dashboard' },
                    { label: 'Quản lý đấu giá', to: '/admin/auctions-management' },
                    { label: 'Chi tiết đấu giá' }
                ]}
            />

            <div className={styles.container}>
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Thông tin cơ bản</h3>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>AuctionID:</label>
                            <span>{auction.AuctionID}</span>
                        </div>
                        <div className={styles.field}>
                            <label>AuctionUID:</label>
                            <span>{auction.AuctionUID}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Trạng thái:</label>
                            <span className={styles[`status-${auction.Status}`]}>
                                {getStatusText(auction.Status)}
                            </span>
                        </div>
                        <div className={styles.field}>
                            <label>Lý do kết thúc:</label>
                            <span>{getEndReasonText(auction.EndReason)}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Thông tin thời gian & giá</h3>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>Thời gian bắt đầu:</label>
                            <span>{fmtDateTime(auction.StartTime)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Thời gian kết thúc:</label>
                            <span>{fmtDateTime(auction.EndTime)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Giá khởi điểm:</label>
                            <span>{formatCurrency(auction.StartPrice)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Giá hiện tại:</label>
                            <span className={styles.amount}>{formatCurrency(auction.CurrentPrice)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Bước giá:</label>
                            <span>{formatCurrency(auction.BidIncrement)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Tổng số lượt đấu giá:</label>
                            <span>{auction.TotalBids || 0}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Thông tin lưu trú</h3>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>Ngày nhận phòng:</label>
                            <span>{fmtDate(auction.StayPeriodStart)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Ngày trả phòng:</label>
                            <span>{fmtDate(auction.StayPeriodEnd)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Số đêm:</label>
                            <span>
                                {auction.StayPeriodStart && auction.StayPeriodEnd
                                    ? Math.ceil((new Date(auction.StayPeriodEnd) - new Date(auction.StayPeriodStart)) / (1000 * 60 * 60 * 24))
                                    : '-'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Thông tin sản phẩm</h3>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>ProductID:</label>
                            <span>{auction.ProductID}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Product UID:</label>
                            <span>{auction.ProductUID || '-'}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Tên phòng:</label>
                            <span>{auction.ProductName || '-'}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Giá gốc:</label>
                            <span>{formatCurrency(auction.BasePrice)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Loại chỗ ở:</label>
                            <span>{auction.RoomTypeName || '-'}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Hình thức chỗ ở:</label>
                            <span>{auction.PropertyName || '-'}</span>
                        </div>
                        <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                            <label>Địa chỉ:</label>
                            <span>{auction.Address !== 'N/A' ? auction.Address + ', ' : ''} 
                                {auction.DistrictName}, {auction.ProvinceName}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleBack}
                    className={styles.cancelBtn}
                    disabled={loading}
                >
                    Đóng
                </button>
            </div>
        </div>
    );
};

export default AdminAuctionViewPage;
