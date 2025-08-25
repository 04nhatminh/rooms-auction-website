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
  const [totalPages, setTotalPages] = useState(1);
  const [searchUID, setSearchUID] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState(null);

  const loadAuctions = async () => {
    const token = localStorage.getItem('token');
    console.log('Loading auctions with token:', token);
    if (!token) { alert('Vui lòng đăng nhập lại.'); navigate('/login'); return; }

    try {
      setLoading(true);
      const response = await auctionApi.getAllAuctionsForAdmin(token, currentPage, 10);

      // Handle different response formats
      if (response.success) {
        setAuctions(response.data?.items || response.data || []);
        setTotalPages(response.data?.totalPages || 1);
        setPagination({
          currentPage: response.data?.currentPage || currentPage,
          totalPages: response.data?.totalPages || 1,
          totalItems: response.data?.totalItems || 0,
          itemsPerPage: 10
        });
      } else {
        // Fallback for direct array response
        const list = Array.isArray(response) ? response : [];
        setAuctions(list);
        setTotalPages(Math.ceil(list.length / 10));
        setPagination({
          currentPage: currentPage,
          totalPages: Math.ceil(list.length / 10),
          totalItems: list.length,
          itemsPerPage: 10
        });
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSearching) {
      loadAuctions();
    }
  }, [currentPage, isSearching]);

  const searchAuctionsByUID = async (uid, page = 1) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }

    if (!uid || uid.trim() === '') {
      // If UID is empty, return to normal list
      setIsSearching(false);
      setSearchResults([]);
      setCurrentPage(1);
      return;
    }

    try {
      setLoading(true);
      const response = await auctionApi.searchAuctionsByUID(uid, page, 10, token);
      
      if (response.success) {
        setSearchResults(response.data?.items || []);
        setPagination({
          currentPage: response.data?.currentPage || page,
          totalPages: response.data?.totalPages || 1,
          totalItems: response.data?.totalItems || 0,
          itemsPerPage: 10
        });
        setIsSearching(true);
      } else {
        setSearchResults([]);
        setPagination(null);
      }
    } catch (err) {
      console.error('Error searching auctions by UID:', err);
      alert('Có lỗi xảy ra khi tìm kiếm: ' + err.message);
      setSearchResults([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchUID(value);
  };

  const handleSearch = () => {
    if (searchUID.trim() !== '') {
      setCurrentPage(1);
      searchAuctionsByUID(searchUID, 1);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleReset = () => {
    setSearchUID('');
    setIsSearching(false);
    setSearchResults([]);
    setCurrentPage(1);
    // loadAuctions will be called by useEffect when isSearching changes to false
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    if (isSearching && searchUID.trim() !== '') {
      // If we're searching, search with the new page
      searchAuctionsByUID(searchUID, page);
    }
    // Otherwise, useEffect will handle loading normal auctions
  };

  const handleDeleteAuction = async (auctionId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }

    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

    try {
      await auctionApi.deleteAuction(auctionId, token);
      
      // Reload the appropriate list
      if (isSearching && searchUID.trim() !== '') {
        await searchAuctionsByUID(searchUID, currentPage);
      } else {
        await loadAuctions();
      }
      
      alert('Xóa sản phẩm thành công!');
    } catch (err) {
      alert('Có lỗi xảy ra khi xóa sản phẩm: ' + err.message);
    }
  };

  const handleAddAuction = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }
    navigate('/admin/auctions-management/add');
  };

  const handleViewAuction = async (auctionUID) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }
    navigate(`/admin/auctions-management/view/${auctionUID}`);
  };

  const handleEditAuction = async (auctionUID) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }
    navigate(`/admin/auctions-management/edit/${auctionUID}`);
  };

  const formatCurrency = (price) => {
    if (!price || isNaN(price)) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Get the auctions to display (either search results or normal auctions)
  const displayAuctions = isSearching ? searchResults : auctions;

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
          crumbs={[
            { label: 'Dashboard', to: '/admin/dashboard' },
            { label: 'Quản lý đấu giá' }
          ]}
        />
        <div className={styles.error}>Lỗi: {error}</div>
        <button onClick={loadAuctions} className={styles.retryBtn}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Quản lý đấu giá"
        crumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Quản lý đấu giá' }
        ]}
      />

      <div className={styles.controlsBar}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Tìm kiếm theo UID..."
            value={searchUID}
            onChange={handleSearchInputChange}
            onKeyPress={handleSearchKeyPress}
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchBtn}>
            Tìm kiếm
          </button>
          {isSearching && (
            <button onClick={handleReset} className={styles.resetBtn}>
              Reset
            </button>
          )}
        </div>

        <button onClick={handleAddAuction} className={styles.addBtn}>
          + Thêm sản phẩm mới
        </button>
      </div>

      <div className={styles.layout}>
        <main className={styles.main}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeader}>
                  <th className={styles.AuctionID}>ID</th>
                  <th className={styles.AuctionUID}>AuctionUID</th>
                  <th className={styles.ProductID}>ProductID</th>
                  <th className={styles.StayPeriodStart}>StayPeriodStart</th>
                  <th className={styles.StayPeriodEnd}>StayPeriodEnd</th>
                  <th className={styles.StartTime}>StartTime</th>
                  <th className={styles.EndTime}>EndTime</th>
                  <th className={styles.CurrentPrice}>CurrentPrice</th>
                  <th className={styles.Status}>Status</th>
                  <th className={styles.colActions}>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {displayAuctions.map((auction) => {
                  const auctionId = auction.AuctionID;
                  const auctionUID = auction.AuctionUID;
                  return (
                    <tr key={auctionId} className={styles.row}>
                      <td className={styles.AuctionID}>{auctionId}</td>

                      <td className={styles.colUid}>
                        <span className={styles.AuctionUIDt} title={auctionUID}>
                          {auctionUID}
                        </span>
                      </td>

                      <td className={styles.colName}>
                        <span className={styles.ProductID} title={auction.ProductID}>
                          {auction.ProductID}
                        </span>
                      </td>

                      <td className={styles.StayPeriodStart}>{auction.StayPeriodStart}</td>
                      <td className={styles.StayPeriodEnd}>{auction.StayPeriodEnd}</td>

                      <td className={styles.StartTime}>
                        <span className={styles.StartTimet} title={auction.StartTime}>
                          {auction.StartTime}
                        </span>
                      </td>

                      <td className={styles.EndTime}>
                        <span className={styles.EndTimet} title={auction.EndTime}>
                          {auction.EndTime}
                        </span>
                      </td>

                      <td className={styles.currentPrice}>
                        <span className={styles.currentPrice}>
                          {formatCurrency(auction.currentPrice)}
                        </span>
                      </td>

                      <td className={styles.status}>{auction.Status}</td>
                      
                      <td className={styles.colActions}>
                        <div className={styles.actions}>
                          <button
                            className={styles.btnEdit}
                            onClick={() => handleEditAuction(auction.AuctionUID)}
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

                {displayAuctions.length === 0 && !isSearching && (
                  <tr>
                    <td colSpan={9} className={styles.empty}>
                      <div className={styles.emptyText}>
                        Chưa có sản phẩm nào
                      </div>
                    </td>
                  </tr>
                )}

                {displayAuctions.length === 0 && isSearching && (
                  <tr>
                    <td colSpan={9} className={styles.empty}>
                      <div className={styles.emptyText}>
                        Không tìm thấy sản phẩm nào với UID "{searchUID}"
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination 
              pagination={pagination} 
              onPageChange={handlePageChange} 
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminAuctionsManagementPage;
