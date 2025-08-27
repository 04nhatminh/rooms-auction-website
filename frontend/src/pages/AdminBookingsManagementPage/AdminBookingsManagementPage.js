import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader/PageHeader';
import Pagination from '../../components/Pagination/Pagination';
import styles from './AdminBookingsManagementPage.module.css';
import ViewIcon from '../../assets/view.png';
import EditIcon from '../../assets/edit.png';
import bookingApi from '../../api/bookingApi';

const AdminBookingsManagementPage = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchBookingId, setSearchBookingId] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [pagination, setPagination] = useState(null);
    
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isFilteringByStatus, setIsFilteringByStatus] = useState(false);
    const [statusFilterResults, setStatusFilterResults] = useState([]);

    const pageSize = 10;

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

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending': return 'statusBadge pending';
            case 'confirmed': return 'statusBadge confirmed';
            case 'cancelled': return 'statusBadge cancelled';
            case 'completed': return 'statusBadge completed';
            case 'expired': return 'statusBadge expired';
            default: return 'statusBadge';
        }
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

    const loadBookings = async () => {
        try {
            setLoading(true);
            const response = await bookingApi.getAllBookingsForAdmin(currentPage, pageSize);

            if (response?.success) {
                const items = response.data?.items || response.data || [];
                setBookings(items);
                setPagination({
                    currentPage: response.data?.currentPage || currentPage,
                    totalPages: response.data?.totalPages || 1,
                    totalItems: response.data?.totalItems || items.length,
                    itemsPerPage: pageSize,
                });
            } else {
                const list = Array.isArray(response) ? response : [];
                setBookings(list);
                const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
                setPagination({
                    currentPage,
                    totalPages,
                    totalItems: list.length,
                    itemsPerPage: pageSize,
                });
            }
        } catch (err) {
            console.error('Error loading bookings:', err);
            setError(err.message || 'Đã xảy ra lỗi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isSearching && !isFilteringByStatus) loadBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, isSearching, isFilteringByStatus]);

    const doSearch = async (bookingId, page = 1) => {
        if (!bookingId?.trim()) {
            setIsSearching(false);
            setSearchResults([]);
            setCurrentPage(1);
            return;
        }

        try {
            setLoading(true);
            const response = await bookingApi.searchBookingsByIdForAdmin(bookingId.trim());
            if (response?.success) {
                const items = response.data?.items || response.data || [];
                setSearchResults(items);
                setPagination({
                    currentPage: page,
                    totalPages: Math.ceil(items.length / pageSize),
                    totalItems: items.length,
                    itemsPerPage: pageSize,
                });
                setIsSearching(true);
                // khi search thì tắt filter
                setIsFilteringByStatus(false);
                setSelectedStatus('');
            } else {
                setSearchResults([]);
                setPagination({
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: 0,
                    itemsPerPage: pageSize,
                });
            }
        } catch (err) {
            console.error('Error searching bookings:', err);
            alert('Có lỗi xảy ra khi tìm kiếm: ' + err.message);
            setSearchResults([]);
            setPagination({
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: pageSize,
            });
        } finally {
            setLoading(false);
        }
    };

    const doFilterByStatus = async (status, page = 1) => {
        if (!status) {
            setIsFilteringByStatus(false);
            setStatusFilterResults([]);
            setCurrentPage(1);
            return;
        }

        try {
        setLoading(true);
        const response = await bookingApi.getAllBookingsByStatusForAdmin(status, page, pageSize);
        if (response?.success) {
            const items = response.data?.items || response.data || [];
            setStatusFilterResults(items);
            setPagination({
                currentPage: response.data?.currentPage || page,
                totalPages: response.data?.totalPages || Math.ceil(items.length / pageSize),
                totalItems: response.data?.totalItems || items.length,
                itemsPerPage: pageSize,
            });
            setIsFilteringByStatus(true);
            // khi filter thì tắt search
            setIsSearching(false);
            setSearchBookingId('');
        } else {
            setStatusFilterResults([]);
            setPagination({
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: pageSize,
            });
        }
        } catch (err) {
            console.error('Error filtering bookings by status:', err);
            alert('Có lỗi xảy ra khi lọc theo trạng thái: ' + err.message);
            setStatusFilterResults([]);
            setPagination({
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: pageSize,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (searchBookingId.trim() !== '') {
            setCurrentPage(1);
            doSearch(searchBookingId, 1);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        if (isSearching && searchBookingId.trim() !== '') {
            doSearch(searchBookingId, page);
        } else if (isFilteringByStatus && selectedStatus) {
            doFilterByStatus(selectedStatus, page);
        }
    };

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        setCurrentPage(1);
        if (status) {
            doFilterByStatus(status, 1);
        } else {
            setIsFilteringByStatus(false);
            setStatusFilterResults([]);
        }
    };

    // Reset riêng cho Search
    const handleResetSearch = () => {
        setSearchBookingId('');
        setIsSearching(false);
        setSearchResults([]);
        setCurrentPage(1);
    };

    // Reset riêng cho Dropdown (Status)
    const handleResetFilter = () => {
        setSelectedStatus('');
        setIsFilteringByStatus(false);
        setStatusFilterResults([]);
        setCurrentPage(1);
    };

    const handleViewBooking = (bookingId) => {
        navigate(`/admin/bookings-management/view/${bookingId}`);
    };

    const handleEditBooking = (bookingId) => {
        navigate(`/admin/bookings-management/edit/${bookingId}`);
    };

    const displayBookings = isSearching ? searchResults : (isFilteringByStatus ? statusFilterResults : bookings);

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
            title="Quản lý đặt phòng"
            crumbs={[{ label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Quản lý đặt phòng' }]}
            />
            <div className={styles.error}>Lỗi: {error}</div>
            <button onClick={loadBookings} className={styles.retryBtn}>Thử lại</button>
        </div>
        );
    }

    return (
        <div className={styles.page}>
        <PageHeader
            title="Quản lý đặt phòng"
            crumbs={[{ label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Quản lý đặt phòng' }]}
        />

        <div className={styles.controlsBar}>
            {/* Khối Search + Reset riêng của Search */}
            <div className={styles.searchContainer}>
            <input
                type="text"
                placeholder="Tìm kiếm theo BookingID..."
                value={searchBookingId}
                onChange={(e) => setSearchBookingId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className={styles.searchInput}
            />
            <button onClick={handleSearch} className={styles.searchBtn}>Tìm kiếm</button>
            {isSearching && (
                <button onClick={handleResetSearch} className={styles.resetBtn}>Reset</button>
            )}
            </div>

            {/* Khối Reset của Dropdown (bên trái) + Dropdown */}
            <div className={styles.filterContainer}>
            {isFilteringByStatus && (
                <button onClick={handleResetFilter} className={styles.resetBtn}>Reset</button>
            )}
            <select 
                value={selectedStatus} 
                onChange={(e) => handleStatusChange(e.target.value)}
                className={styles.statusSelect}
            >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="cancelled">Đã hủy</option>
                <option value="completed">Hoàn thành</option>
                <option value="expired">Hết hạn</option>
            </select>
            </div>
        </div>

        <div className={styles.layout}>
            <main className={styles.main}>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                <thead>
                    <tr className={styles.tableHeader}>
                    <th className={styles.colId}>ID</th>
                    <th className={styles.colUserName}>Khách hàng</th>
                    <th className={styles.colProductName}>Phòng</th>
                    <th className={styles.colStartDate}>Nhận phòng</th>
                    <th className={styles.colEndDate}>Trả phòng</th>
                    <th className={styles.colStatus}>Trạng thái</th>
                    <th className={styles.colUnitPrice}>Đơn giá</th>
                    <th className={styles.colAmount}>Phí lưu trú</th>
                    <th className={styles.colServiceFee}>Phí dịch vụ</th>
                    <th className={styles.colTotalAmount}>Tổng tiền</th>
                    <th className={styles.colCreatedAt}>Ngày tạo</th>
                    <th className={styles.colActions}>Hành động</th>
                    </tr>
                </thead>

                <tbody>
                    {displayBookings.map((b) => {
                    const bookingId = b.BookingID ?? b.bookingId ?? b.id;
                    const userName = b.UserName ?? b.FullName ?? b.userName;
                    const productName = b.ProductName ?? b.productName;
                    const startDate = b.StartDate ?? b.startDate;
                    const endDate = b.EndDate ?? b.endDate;
                    const status = b.BookingStatus ?? b.status;
                    const unitPrice = b.UnitPrice ?? b.unitPrice;
                    const amount = b.Amount ?? b.amount;
                    const serviceFee = b.ServiceFee ?? b.serviceFee;
                    const totalAmount = b.TotalAmount ?? b.totalAmount;
                    const createdAt = b.CreatedAt ?? b.createdAt;

                    return (
                        <tr key={bookingId} className={styles.row}>
                            <td className={styles.colId}>{bookingId}</td>

                            <td className={styles.colUserName}>
                                <span className={styles.userText} title={userName}>{userName || '-'}</span>
                            </td>

                            <td className={styles.colProductName}>
                                <span className={styles.productText} title={productName}>{productName || '-'}</span>
                            </td>

                            <td className={styles.colStartDate}>{fmtDate(startDate)}</td>
                            <td className={styles.colEndDate}>{fmtDate(endDate)}</td>

                            <td className={styles.colStatus}>
                                <span className={styles[getStatusBadgeClass(status)]}>
                                {getStatusText(status)}
                                </span>
                            </td>

                            <td className={styles.colUnitPrice}>{formatCurrency(unitPrice)}</td>

                            <td className={styles.colAmount}>
                                <span className={styles.amountText}>{formatCurrency(amount)}</span>
                            </td>

                            <td className={styles.colServiceFee}>{formatCurrency(serviceFee)}</td>
                            <td className={styles.colTotalAmount}>{formatCurrency(totalAmount)}</td>

                            <td className={styles.colCreatedAt}>{fmtDate(createdAt)}</td>

                            <td className={styles.colActions}>
                                <div className={styles.actions}>
                                <button
                                    className={styles.btnView}
                                    onClick={() => handleViewBooking(bookingId)}
                                    title="Xem chi tiết"
                                >
                                    <img src={ViewIcon} alt="Xem chi tiết" />
                                </button>

                                <button
                                    className={styles.btnEdit}
                                    onClick={() => handleEditBooking(bookingId)}
                                    title="Chỉnh sửa"
                                >
                                    <img src={EditIcon} alt="Chỉnh sửa" />
                                </button>
                                </div>
                            </td>
                        </tr>
                    );
                    })}

                    {displayBookings.length === 0 && !isSearching && !isFilteringByStatus && (
                    <tr>
                        <td colSpan={10} className={styles.empty}>
                        <div className={styles.emptyText}>Chưa có đặt phòng nào</div>
                        </td>
                    </tr>
                    )}

                    {displayBookings.length === 0 && isSearching && (
                    <tr>
                        <td colSpan={10} className={styles.empty}>
                        <div className={styles.emptyText}>
                            Không tìm thấy đặt phòng nào với ID "{searchBookingId}"
                        </div>
                        </td>
                    </tr>
                    )}

                    {displayBookings.length === 0 && isFilteringByStatus && (
                    <tr>
                        <td colSpan={10} className={styles.empty}>
                        <div className={styles.emptyText}>
                            Không có đặt phòng nào với trạng thái "{getStatusText(selectedStatus)}"
                        </div>
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
                <Pagination pagination={pagination} onPageChange={handlePageChange} />
            )}
            </main>
        </div>
        </div>
    );
};

export default AdminBookingsManagementPage;
