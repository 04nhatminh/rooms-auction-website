import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader/PageHeader';
import styles from './AdminAuctionEditPage.module.css';
import auctionApi from '../../api/auctionApi';

const AdminAuctionEditPage = () => {
    const { auctionUID } = useParams();
    const navigate = useNavigate();
    const [auction, setAuction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        Status: '',
        EndReason: ''
    });

    const statusOptions = [
        { value: 'active', label: 'Đang hoạt động' },
        { value: 'ended', label: 'Đã kết thúc' },
        { value: 'cancelled', label: 'Đã hủy' }
    ];

    const endReasonOptions = [
        { value: '', label: 'Không có' },
        { value: 'natural_end', label: 'Kết thúc tự nhiên' },
        { value: 'buy_now', label: 'Mua ngay' },
        { value: 'cancelled', label: 'Bị hủy' },
        { value: 'admin_force', label: 'Admin ép kết thúc' }
    ];

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
                    const auctionData = response.data;
                    setAuction(auctionData);
                    setFormData({
                        Status: auctionData.Status || '',
                        EndReason: auctionData.EndReason || ''
                    });
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setSaving(true);
            
            // Chỉ update nếu có thay đổi
            if (formData.Status === auction.Status && formData.EndReason === auction.EndReason) {
                alert('Không có thay đổi nào để lưu');
                return;
            }

            const response = await auctionApi.updateAuctionStatus(
                auctionUID, 
                formData.Status, 
                formData.EndReason || null
            );

            if (response?.success) {
                alert('Cập nhật đấu giá thành công!');
                navigate('/admin/auctions-management');
            } else {
                alert('Có lỗi xảy ra khi cập nhật đấu giá');
            }
        } catch (err) {
            console.error('Error updating auction:', err);
            alert('Có lỗi xảy ra: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

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
                    title="Chỉnh sửa đấu giá"
                    crumbs={[
                        { label: 'Dashboard', to: '/admin/dashboard' },
                        { label: 'Quản lý đấu giá', to: '/admin/auctions-management' },
                        { label: 'Chỉnh sửa đấu giá' }
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
                    title="Chỉnh sửa đấu giá"
                    crumbs={[
                        { label: 'Dashboard', to: '/admin/dashboard' },
                        { label: 'Quản lý đấu giá', to: '/admin/auctions-management' },
                        { label: 'Chỉnh sửa đấu giá' }
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
                title={`Chỉnh sửa đấu giá #${auction.AuctionUID}`}
                crumbs={[
                    { label: 'Dashboard', to: '/admin/dashboard' },
                    { label: 'Quản lý đấu giá', to: '/admin/auctions-management' },
                    { label: 'Chỉnh sửa đấu giá' }
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
                            <label>Trạng thái đấu giá:</label>
                            <div className={styles.statusRow}>
                                <select
                                    id="Status"
                                    name="Status"
                                    value={formData.Status}
                                    onChange={handleInputChange}
                                    className={`${styles.select} ${styles.statusSelect}`}
                                >
                                    {statusOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Preview pill theo trạng thái hiện chọn */}
                                <span
                                    className={`${styles.statusPill} ${
                                        formData.Status === 'active' ? styles['status-active'] :
                                        formData.Status === 'ended' ? styles['status-ended'] :
                                        formData.Status === 'cancelled' ? styles['status-cancelled'] :
                                        ''
                                    }`}
                                >
                                    {statusOptions.find(o => o.value === formData.Status)?.label || '—'}
                                </span>
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label>Lý do kết thúc:</label>
                            <select
                                id="EndReason"
                                name="EndReason"
                                value={formData.EndReason}
                                onChange={handleInputChange}
                                className={`${styles.select}`}
                            >
                                {endReasonOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
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

                <div className={styles.formActions}>
                    <button
                        type="button"
                        onClick={handleBack}
                        className={styles.cancelBtn}
                        disabled={saving}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className={styles.saveBtn}
                        disabled={saving}
                    >
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminAuctionEditPage;
