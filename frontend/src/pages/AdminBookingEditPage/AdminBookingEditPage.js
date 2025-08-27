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
      
      // Prepare update data
      const updateData = {};
      
      if (formData.BookingStatus !== booking.BookingStatus) {
        updateData.BookingStatus = formData.BookingStatus;
      }
      
      if (parseFloat(formData.UnitPrice) !== parseFloat(booking.UnitPrice)) {
        updateData.UnitPrice = parseFloat(formData.UnitPrice);
      }
      
      if (parseFloat(formData.Amount) !== parseFloat(booking.Amount)) {
        updateData.Amount = parseFloat(formData.Amount);
      }
      
      if (parseFloat(formData.ServiceFee) !== parseFloat(booking.ServiceFee)) {
        updateData.ServiceFee = parseFloat(formData.ServiceFee);
      }
      
      if (formData.PaymentMethodID !== booking.PaymentMethodID) {
        updateData.PaymentMethodID = formData.PaymentMethodID ? parseInt(formData.PaymentMethodID) : null;
      }

      if (Object.keys(updateData).length === 0) {
        alert('Không có thay đổi nào để cập nhật');
        return;
      }

      const response = await bookingApi.updateBookingForAdmin(bookingId, updateData);
      
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
        title={`Chỉnh sửa đặt phòng #${booking.BookingID}`}
        crumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Quản lý đặt phòng', to: '/admin/bookings-management' },
          { label: 'Chỉnh sửa đặt phòng' }
        ]}
      />

      <div className={styles.actions}>
        <button onClick={handleBack} className={styles.backBtn}>← Quay lại danh sách</button>
      </div>

      <div className={styles.container}>
        {/* Thông tin không thể chỉnh sửa */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Thông tin cơ bản (chỉ xem)</h3>
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
              <label>Nguồn:</label>
              <span>{getSourceText(booking.Source)}</span>
            </div>
            <div className={styles.field}>
              <label>Khách hàng:</label>
              <span>{booking.UserName || '-'} (ID: {booking.UserID})</span>
            </div>
            <div className={styles.field}>
              <label>Sản phẩm:</label>
              <span>{booking.ProductName || '-'} (ID: {booking.ProductID})</span>
            </div>
            <div className={styles.field}>
              <label>Thời gian lưu trú:</label>
              <span>{fmtDate(booking.StartDate)} - {fmtDate(booking.EndDate)}</span>
            </div>
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

        {/* Form chỉnh sửa */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Thông tin có thể chỉnh sửa</h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label htmlFor="BookingStatus">Trạng thái đặt phòng:</label>
                <select
                  id="BookingStatus"
                  name="BookingStatus"
                  value={formData.BookingStatus}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formField}>
                <label htmlFor="UnitPrice">Đơn giá (VND):</label>
                <input
                  type="number"
                  id="UnitPrice"
                  name="UnitPrice"
                  value={formData.UnitPrice}
                  onChange={handleInputChange}
                  className={styles.input}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="Amount">Tổng tiền (VND):</label>
                <input
                  type="number"
                  id="Amount"
                  name="Amount"
                  value={formData.Amount}
                  onChange={handleInputChange}
                  className={styles.input}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="ServiceFee">Phí dịch vụ (VND):</label>
                <input
                  type="number"
                  id="ServiceFee"
                  name="ServiceFee"
                  value={formData.ServiceFee}
                  onChange={handleInputChange}
                  className={styles.input}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="PaymentMethodID">Payment Method ID:</label>
                <input
                  type="number"
                  id="PaymentMethodID"
                  name="PaymentMethodID"
                  value={formData.PaymentMethodID}
                  onChange={handleInputChange}
                  className={styles.input}
                  min="1"
                />
                <small className={styles.helpText}>
                  Hiện tại: {booking.PaymentMethodName || 'Chưa có'}
                </small>
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
                className={styles.saveBtn}
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminBookingEditPage;
