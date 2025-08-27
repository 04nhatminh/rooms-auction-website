import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader/PageHeader';
import styles from './AdminBookingViewPage.module.css';
import bookingApi from '../../api/bookingApi';

const AdminBookingViewPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
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
      case 'pending': return 'Chờ xử lý';
      case 'confirmed': return 'Đã xác nhận';
      case 'cancelled': return 'Đã hủy';
      case 'completed': return 'Hoàn thành';
      case 'expired': return 'Hết hạn';
      default: return status;
    }
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
          setBooking(response.data);
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

  const handleEdit = () => {
    navigate(`/admin/bookings-management/edit/${bookingId}`);
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
          title="Chi tiết đặt phòng"
          crumbs={[
            { label: 'Dashboard', to: '/admin/dashboard' },
            { label: 'Quản lý đặt phòng', to: '/admin/bookings-management' },
            { label: 'Chi tiết đặt phòng' }
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
          title="Chi tiết đặt phòng"
          crumbs={[
            { label: 'Dashboard', to: '/admin/dashboard' },
            { label: 'Quản lý đặt phòng', to: '/admin/bookings-management' },
            { label: 'Chi tiết đặt phòng' }
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
          { label: 'Chi tiết đặt phòng' }
        ]}
      />

      <div className={styles.actions}>
        <button onClick={handleBack} className={styles.backBtn}>← Quay lại</button>
        <button onClick={handleEdit} className={styles.editBtn}>Chỉnh sửa</button>
      </div>

      <div className={styles.container}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Thông tin cơ bản</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>BookingID:</label>
              <span>{booking.BookingID}</span>
            </div>
            <div className={styles.field}>
              <label>BidID:</label>
              <span>{booking.BidID || '-'}</span>
            </div>
            <div className={styles.field}>
              <label>Trạng thái:</label>
              <span className={styles[`status-${booking.BookingStatus}`]}>
                {getStatusText(booking.BookingStatus)}
              </span>
            </div>
            <div className={styles.field}>
              <label>Nguồn:</label>
              <span>{getSourceText(booking.Source)}</span>
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
              <span>{booking.UserPhone || '-'}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Thông tin sản phẩm</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>ProductID:</label>
              <span>{booking.ProductID}</span>
            </div>
            <div className={styles.field}>
              <label>Product UID:</label>
              <span>{booking.ProductUID || '-'}</span>
            </div>
            <div className={styles.field}>
              <label>Tên sản phẩm:</label>
              <span>{booking.ProductName || '-'}</span>
            </div>
            <div className={styles.field}>
              <label>Mô tả:</label>
              <span>{booking.ProductDescription || '-'}</span>
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
          <h3 className={styles.sectionTitle}>Thông tin thanh toán</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Đơn giá:</label>
              <span>{formatCurrency(booking.UnitPrice)}</span>
            </div>
            <div className={styles.field}>
              <label>Tổng tiền:</label>
              <span className={styles.amount}>{formatCurrency(booking.Amount)}</span>
            </div>
            <div className={styles.field}>
              <label>Phí dịch vụ:</label>
              <span>{formatCurrency(booking.ServiceFee)}</span>
            </div>
            <div className={styles.field}>
              <label>Phương thức thanh toán:</label>
              <span>{booking.PaymentMethodName || '-'}</span>
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
      </div>
    </div>
  );
};

export default AdminBookingViewPage;
