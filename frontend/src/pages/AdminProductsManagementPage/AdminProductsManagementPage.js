import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader/PageHeader';
import Pagination from '../../components/Pagination/Pagination';
import styles from './AdminProductsManagementPage.module.css';
import ViewIcon from '../../assets/view.png';
import EditIcon from '../../assets/edit.png';
import DeleteIcon from '../../assets/delete.png';
import productApi from '../../api/productApi';

const AdminProductsManagementPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchUID, setSearchUID] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (!isSearching) {
      loadProducts();
    }
  }, [currentPage, isSearching]);

  const loadProducts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await productApi.getProducts(currentPage, 10, token);
      
      // Handle different response formats
      if (response.success) {
        setProducts(response.data?.items || response.data || []);
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
        setProducts(list);
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
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchProductsByUID = async (uid, page = 1) => {
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
      const response = await productApi.searchProductsByUID(uid, page, 10, token);
      
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
      console.error('Error searching products by UID:', err);
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
      searchProductsByUID(searchUID, 1);
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
    // loadProducts will be called by useEffect when isSearching changes to false
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    if (isSearching && searchUID.trim() !== '') {
      // If we're searching, search with the new page
      searchProductsByUID(searchUID, page);
    }
    // Otherwise, useEffect will handle loading normal products
  };

  const handleDeleteProduct = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }

    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

    try {
      await productApi.deleteProduct(productId, token);
      
      // Reload the appropriate list
      if (isSearching && searchUID.trim() !== '') {
        await searchProductsByUID(searchUID, currentPage);
      } else {
        await loadProducts();
      }
      
      alert('Xóa sản phẩm thành công!');
    } catch (err) {
      alert('Có lỗi xảy ra khi xóa sản phẩm: ' + err.message);
    }
  };

  const handleAddProduct = () => {
    navigate('/admin/add-product');
  };

  const handleEditProduct = (productId) => {
    navigate(`/admin/edit-product/${productId}`);
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

  // Get the products to display (either search results or normal products)
  const displayProducts = isSearching ? searchResults : products;

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
          title="Quản lý sản phẩm"
          crumbs={[
            { label: 'Dashboard', to: '/admin/dashboard' },
            { label: 'Quản lý sản phẩm' }
          ]}
        />
        <div className={styles.error}>Lỗi: {error}</div>
        <button onClick={loadProducts} className={styles.retryBtn}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Quản lý sản phẩm"
        crumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Quản lý sản phẩm' }
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

        <button onClick={handleAddProduct} className={styles.addBtn}>
          + Thêm sản phẩm mới
        </button>
      </div>

      <div className={styles.layout}>
        <main className={styles.main}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeader}>
                  <th className={styles.colId}>ID</th>
                  <th className={styles.colUid}>UID</th>
                  <th className={styles.colName}>Tên sản phẩm</th>
                  <th className={styles.colType}>Loại</th>
                  <th className={styles.colDistrict}>Huyện</th>
                  <th className={styles.colProvince}>Tỉnh</th>
                  <th className={styles.colPrice}>Giá</th>
                  <th className={styles.colSource}>Nguồn</th>
                  <th className={styles.colActions}>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {displayProducts.map((product) => {
                  const productId = product.ProductID;
                  return (
                    <tr key={productId} className={styles.row}>
                      <td className={styles.colId}>{productId}</td>

                      <td className={styles.colUid}>
                        <span className={styles.uidText} title={product.UID}>
                          {product.UID}
                        </span>
                      </td>

                      <td className={styles.colName}>
                        <span className={styles.nameText} title={product.productName}>
                          {product.productName}
                        </span>
                      </td>

                      <td className={styles.colType}>{product.propertyTypeName}</td>

                      <td className={styles.colDistrict}>
                        <span className={styles.districtText} title={product.districtName}>
                          {product.districtName}
                        </span>
                      </td>

                      <td className={styles.colProvince}>
                        <span className={styles.provinceText} title={product.provinceName}>
                          {product.provinceName}
                        </span>
                      </td>

                      <td className={styles.colPrice}>
                        <span className={styles.priceText}>
                          {formatCurrency(product.Price)}
                        </span>
                      </td>

                      <td className={styles.colSource}>{product.Source}</td>
                      
                      <td className={styles.colActions}>
                        <div className={styles.actions}>
                          <button className={styles.btnView}
                            onClick={() => navigate(`/product/${productId}`)}
                            title="Xem chi tiết"
                          >
                            <img src={ViewIcon} alt="Xem chi tiết" />
                          </button>

                          <button
                            className={styles.btnEdit}
                            onClick={() => handleEditProduct(productId)}
                            title="Chỉnh sửa"
                          >
                            <img src={EditIcon} alt="Chỉnh sửa" />
                          </button>

                          <button
                            className={styles.btnDelete}
                            onClick={() => handleDeleteProduct(productId)}
                            title="Xóa"
                          >
                            <img src={DeleteIcon} alt="Xóa" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {displayProducts.length === 0 && !isSearching && (
                  <tr>
                    <td colSpan={9} className={styles.empty}>
                      <div className={styles.emptyText}>
                        Chưa có sản phẩm nào
                      </div>
                    </td>
                  </tr>
                )}

                {displayProducts.length === 0 && isSearching && (
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

export default AdminProductsManagementPage;
