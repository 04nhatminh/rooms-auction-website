import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader/PageHeader';
import styles from './AdminBookingEditPage.module.css';
import bookingApi from '../../api/bookingApi';

const AdminBookingEditPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    BookingStatus: '',
    UnitPrice: '',
    Amount: '',
    ServiceFee: '',
    PaymentMethodID: ''
  });

  const statusOptions = [
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'cancelled', label: 'Đã hủy' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'expired', label: 'Hết hạn' }
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

  const getSourceText = (source) => {
    switch (source) {
      case 'direct': return 'Đặt trực tiếp';
      case 'auction_win': return 'Thắng đấu giá';
      case 'auction_buy_now': return 'Mua ngay từ đấu giá';
      default: return source;
    }
  };

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await bookingApi.getBookingDetailsForAdmin(bookingId);
        
        if (response?.success) {
          const bookingData = response.data;
          setBooking(bookingData);
          setFormData({
            BookingStatus: bookingData.BookingStatus || '',
            UnitPrice: bookingData.UnitPrice || '',
            Amount: bookingData.Amount || '',
            ServiceFee: bookingData.ServiceFee || '',
            PaymentMethodID: bookingData.PaymentMethodID || ''
          });
        } else {
          setError('Không thể tải chi tiết đặt phòng');
        }
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError(err.message || 'Đã xảy ra lỗi khi tải chi tiết đặt phòng');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

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

        // Prepare update status
       let updateStatus;

        if (formData.BookingStatus !== booking.BookingStatus) {
            updateStatus = formData.BookingStatus;
        }

        if (!updateStatus) {
            alert('Không có thay đổi nào để cập nhật');
            return;
        }

        const response = await bookingApi.updateBookingForAdmin(booking.BookingID, updateStatus);
        
        if (response?.success) {
            alert('Cập nhật đặt phòng thành công!');
            navigate(`/admin/bookings-management/view/${bookingId}`);
        } else {
            throw new Error('Cập nhật thất bại');
        }
        } catch (err) {
            console.error('Error updating booking:', err);
            alert('Có lỗi xảy ra khi cập nhật: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(`/admin/bookings-management/view/${bookingId}`);
    };

    const handleBack = () => {
        navigate('/admin/bookings-management');
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
            title="Chỉnh sửa đặt phòng"
            crumbs={[
                { label: 'Dashboard', to: '/admin/dashboard' },
                { label: 'Quản lý đặt phòng', to: '/admin/bookings-management' },
                { label: 'Chỉnh sửa đặt phòng' }
            ]}
            />
            <div className={styles.error}>Lỗi: {error}</div>
            <button onClick={handleBack} className={styles.backBtn}>Quay lại</button>
        </div>
        );
    }

    if (!booking) {
        return (
        <div className={styles.page}>
            <PageHeader
            title="Chỉnh sửa đặt phòng"
            crumbs={[
                { label: 'Dashboard', to: '/admin/dashboard' },
                { label: 'Quản lý đặt phòng', to: '/admin/bookings-management' },
                { label: 'Chỉnh sửa đặt phòng' }
            ]}
            />
            <div className={styles.error}>Không tìm thấy đặt phòng</div>
            <button onClick={handleBack} className={styles.backBtn}>Quay lại</button>
        </div>
        );
    }

    return (
        <div className={styles.page}>
            <PageHeader
                title={`Chi tiết đặt phòng #${booking.BookingID}`}
                crumbs={[
                    { label: 'Dashboard', to: '/admin/dashboard' },
                    { label: 'Quản lý đặt phòng', to: '/admin/bookings-management' },
                    { label: 'Chỉnh sửa đặt phòng' }
                ]}
            />

            <div className={styles.container}>
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Thông tin cơ bản</h3>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>BookingID:</label>
                            <span>{booking.BookingID}</span>
                        </div>

                        <div className={styles.field}>
                            <label>Trạng thái đặt phòng:</label>

                            <div className={styles.statusRow}>
                                <select
                                id="BookingStatus"
                                name="BookingStatus"
                                value={formData.BookingStatus}
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
                                    formData.BookingStatus === 'pending' ? styles['status-pending'] :
                                    formData.BookingStatus === 'confirmed' ? styles['status-confirmed'] :
                                    formData.BookingStatus === 'cancelled' ? styles['status-cancelled'] :
                                    formData.BookingStatus === 'completed' ? styles['status-completed'] :
                                    styles['status-expired']
                                }`}
                                >
                                {statusOptions.find(o => o.value === formData.BookingStatus)?.label || '—'}
                                </span>
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label>Nguồn:</label>
                            <span>{getSourceText(booking.Source)}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Thông tin lưu trú</h3>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>Ngày nhận phòng:</label>
                            <span>{fmtDate(booking.StartDate)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Ngày trả phòng:</label>
                            <span>{fmtDate(booking.EndDate)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Số đêm:</label>
                            <span>
                                {booking.StartDate && booking.EndDate
                                ? Math.ceil((new Date(booking.EndDate) - new Date(booking.StartDate)) / (1000 * 60 * 60 * 24))
                                : '-'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Thông tin khách hàng</h3>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>UserID:</label>
                            <span>{booking.UserID}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Tên khách hàng:</label>
                            <span>{booking.UserName || '-'}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Email:</label>
                            <span>{booking.UserEmail || '-'}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Số điện thoại:</label>
                            <span>{booking.PhoneNumber || '-'}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Ngày sinh:</label>
                            <span>{booking.DateOfBirth || '-'}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Giới tính:</label>
                            <span>{booking.Gender || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Thông tin sản phẩm</h3>
                <div className={styles.grid}>
                    <div className={styles.field}>
                    <label>Product UID:</label>
                    <span>{booking.ProductUID || '-'}</span>
                    </div>
                    <div className={styles.field}>
                    <label>Tên phòng:</label>
                    <span>{booking.ProductName || '-'}</span>
                    </div>
                    <div className={styles.field}>
                    <label>Loại phòng:</label>
                    <span>{booking.RoomTypeName || '-'}</span>
                    </div>
                    <div className={styles.field}>
                    <label>Hình thức chỗ ở:</label>
                    <span>{booking.PropertyName || '-'}</span>
                    </div>
                    <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                    <label>Địa chỉ:</label>
                    <span>{booking.Address != 'N/A' ? booking.Address + ', ' : ''} 
                        {booking.DistrictName}, {booking.ProvinceName} </span>
                    </div>
                </div>
                </div>

                <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Thông tin thanh toán</h3>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>Đơn giá:</label>
                            <span>{formatCurrency(booking.UnitPrice)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Phí lưu trú (
                                        {booking.StartDate && booking.EndDate
                                        ? Math.ceil((new Date(booking.EndDate) - new Date(booking.StartDate)) / (1000 * 60 * 60 * 24))
                                        : '-'} đêm):
                            </label>
                            <span>{formatCurrency(booking.Amount)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Phí dịch vụ:</label>
                            <span>{formatCurrency(booking.ServiceFee)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Tổng tiền thanh toán:</label>
                            <span className={styles.amount}>{formatCurrency(booking.ServiceFee + booking.Amount)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Phương thức thanh toán:</label>
                            <span>{booking.Provider || '-'}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Ngày thanh toán:</label>
                            <span>{fmtDateTime(booking.PaidAt)}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Thông tin hệ thống</h3>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>Ngày tạo:</label>
                            <span>{fmtDateTime(booking.CreatedAt)}</span>
                        </div>
                        <div className={styles.field}>
                            <label>Ngày cập nhật:</label>
                            <span>{fmtDateTime(booking.UpdatedAt)}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.formActions}>
                    <button
                        type="button"
                        onClick={handleCancel}
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

export default AdminBookingEditPage;
