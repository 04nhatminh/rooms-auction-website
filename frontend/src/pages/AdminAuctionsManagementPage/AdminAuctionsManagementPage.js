import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader/PageHeader';
import Pagination from '../../components/Pagination/Pagination';
import styles from './AdminAuctionsManagementPage.module.css';
import ViewIcon from '../../assets/view.png';
import EditIcon from '../../assets/edit.png';
import DeleteIcon from '../../assets/delete.png';
import auctionApi from '../../api/auctionApi';

const AdminAuctionsManagementPage = () => {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchUID, setSearchUID] = useState('');
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

  const loadAuctions = async () => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Vui lòng đăng nhập lại.'); navigate('/login'); return; }

    try {
      setLoading(true);
      const response = await auctionApi.getAllAuctionsForAdmin(currentPage, pageSize, token);

      if (response?.success) {
        const items = response.data?.items || response.data || [];
        setAuctions(items);
        setPagination({
          currentPage: response.data?.currentPage || currentPage,
          totalPages: response.data?.totalPages || 1,
          totalItems: response.data?.totalItems || items.length,
          itemsPerPage: pageSize,
        });
      } else {
        const list = Array.isArray(response) ? response : [];
        setAuctions(list);
        const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
        setPagination({
          currentPage,
          totalPages,
          totalItems: list.length,
          itemsPerPage: pageSize,
        });
      }
    } catch (err) {
      console.error('Error loading auctions:', err);
      setError(err.message || 'Đã xảy ra lỗi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSearching && !isFilteringByStatus) loadAuctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isSearching, isFilteringByStatus]);

  const doSearch = async (uid, page = 1) => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Vui lòng đăng nhập lại.'); navigate('/login'); return; }

    if (!uid?.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      setCurrentPage(1);
      return;
    }

    try {
      setLoading(true);
      const response = await auctionApi.searchAuctionsByUID(uid.trim(), token);
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
      console.error('Error searching auctions:', err);
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
    const token = localStorage.getItem('token');
    if (!token) { alert('Vui lòng đăng nhập lại.'); navigate('/login'); return; }

    if (!status) {
      setIsFilteringByStatus(false);
      setStatusFilterResults([]);
      setCurrentPage(1);
      return;
    }

    try {
      setLoading(true);
      const response = await auctionApi.getAllAuctionsByStatusForAdmin(status, page, pageSize, token);
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
        setSearchUID('');
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
      console.error('Error filtering auctions by status:', err);
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
    if (searchUID.trim() !== '') {
      setCurrentPage(1);
      doSearch(searchUID, 1);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (isSearching && searchUID.trim() !== '') {
      doSearch(searchUID, page);
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

  // ⬇️ Reset riêng cho Search
  const handleResetSearch = () => {
    setSearchUID('');
    setIsSearching(false);
    setSearchResults([]);
    setCurrentPage(1);
  };

  // ⬇️ Reset riêng cho Dropdown (Status)
  const handleResetFilter = () => {
    setSelectedStatus('');
    setIsFilteringByStatus(false);
    setStatusFilterResults([]);
    setCurrentPage(1);
  };

  const handleDeleteAuction = async (auctionId) => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Vui lòng đăng nhập lại.'); navigate('/login'); return; }
    if (!window.confirm('Bạn có chắc muốn xóa đấu giá này?')) return;

    try {
      await auctionApi.deleteAuction(auctionId, token);
      if (isSearching && searchUID.trim() !== '') {
        await doSearch(searchUID, currentPage);
      } else if (isFilteringByStatus && selectedStatus) {
        await doFilterByStatus(selectedStatus, currentPage);
      } else {
        await loadAuctions();
      }
      alert('Xóa đấu giá thành công!');
    } catch (err) {
      alert('Có lỗi xảy ra khi xóa đấu giá: ' + err.message);
    }
  };

  const handleViewAuction = (auctionUID) => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Vui lòng đăng nhập lại.'); navigate('/login'); return; }
    navigate(`/admin/auctions-management/view/${auctionUID}`);
  };

  const handleEditAuction = (auctionUID) => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Vui lòng đăng nhập lại.'); navigate('/login'); return; }
    navigate(`/admin/auctions-management/edit/${auctionUID}`);
  };

  const displayAuctions = isSearching ? searchResults : (isFilteringByStatus ? statusFilterResults : auctions);

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
          title="Quản lý đấu giá"
          crumbs={[{ label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Quản lý đấu giá' }]}
        />
        <div className={styles.error}>Lỗi: {error}</div>
        <button onClick={loadAuctions} className={styles.retryBtn}>Thử lại</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Quản lý đấu giá"
        crumbs={[{ label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Quản lý đấu giá' }]}
      />

      <div className={styles.controlsBar}>
        {/* Khối Search + Reset riêng của Search */}
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Tìm kiếm theo UID..."
            value={searchUID}
            onChange={(e) => setSearchUID(e.target.value)}
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
            <option value="active">Đang hoạt động</option>
            <option value="ended">Đã kết thúc</option>
            <option value="cancelled">Đã hủy</option>
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
                  <th className={styles.colUid}>UID</th>
                  <th className={styles.colProductId}>ProductID</th>
                  <th className={styles.colStayStart}>Stay Start</th>
                  <th className={styles.colStayEnd}>Stay End</th>
                  <th className={styles.colStartTime}>Start Time</th>
                  <th className={styles.colEndTime}>End Time</th>
                  <th className={styles.colPrice}>Current Price</th>
                  <th className={styles.colStatus}>Trạng thái</th>
                  <th className={styles.colActions}>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {displayAuctions.map((a) => {
                  const auctionId = a.AuctionID ?? a.auctionId ?? a.id;
                  const auctionUID = a.AuctionUID ?? a.UID ?? a.uid;
                  const productId = a.ProductID ?? a.productId;
                  const stayStart = a.StayPeriodStart ?? a.stayStart ?? a.stayPeriod?.start;
                  const stayEnd = a.StayPeriodEnd ?? a.stayEnd ?? a.stayPeriod?.end;
                  const startTime = a.StartTime ?? a.startTime;
                  const endTime = a.EndTime ?? a.endTime;
                  const currentPrice = (a.CurrentPrice ?? a.currentPrice);
                  const status = a.Status ?? a.status;

                  return (
                    <tr key={`${auctionId}-${auctionUID}`} className={styles.row}>
                      <td className={styles.colId}>{auctionId}</td>

                      <td className={styles.colUid}>
                        <span className={styles.uidText} title={auctionUID}>{auctionUID}</span>
                      </td>

                      <td className={styles.colProductId}>{productId}</td>

                      <td className={styles.colStayStart}>{fmtDateTime(stayStart)}</td>
                      <td className={styles.colStayEnd}>{fmtDateTime(stayEnd)}</td>

                      <td className={styles.colStartTime}>{fmtDateTime(startTime)}</td>
                      <td className={styles.colEndTime}>{fmtDateTime(endTime)}</td>

                      <td className={styles.colPrice}>
                        <span className={styles.priceText}>{formatCurrency(currentPrice)}</span>
                      </td>

                      <td className={styles.colStatus}>{status || '-'}</td>

                      <td className={styles.colActions}>
                        <div className={styles.actions}>
                          <button
                            className={styles.btnView}
                            onClick={() => handleViewAuction(auctionUID)}
                            title="Xem chi tiết"
                          >
                            <img src={ViewIcon} alt="Xem chi tiết" />
                          </button>

                          <button
                            className={styles.btnEdit}
                            onClick={() => handleEditAuction(auctionUID)}
                            title="Chỉnh sửa"
                          >
                            <img src={EditIcon} alt="Chỉnh sửa" />
                          </button>

                          <button
                            className={styles.btnDelete}
                            onClick={() => handleDeleteAuction(auctionId)}
                            title="Xóa"
                          >
                            <img src={DeleteIcon} alt="Xóa" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {displayAuctions.length === 0 && !isSearching && !isFilteringByStatus && (
                  <tr>
                    <td colSpan={10} className={styles.empty}>
                      <div className={styles.emptyText}>Chưa có đấu giá nào</div>
                    </td>
                  </tr>
                )}

                {displayAuctions.length === 0 && isSearching && (
                  <tr>
                    <td colSpan={10} className={styles.empty}>
                      <div className={styles.emptyText}>
                        Không tìm thấy đấu giá nào với UID “{searchUID}”
                      </div>
                    </td>
                  </tr>
                )}

                {displayAuctions.length === 0 && isFilteringByStatus && (
                  <tr>
                    <td colSpan={10} className={styles.empty}>
                      <div className={styles.emptyText}>
                        Không có đấu giá nào với trạng thái “{selectedStatus}”
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

export default AdminAuctionsManagementPage;