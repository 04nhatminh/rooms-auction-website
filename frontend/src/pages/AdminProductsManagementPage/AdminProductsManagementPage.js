import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader/PageHeader';
import styles from './AdminProductsManagementPage.module.css';
import SearchIcon from '../../assets/search_black.png';
import ViewIcon from '../../assets/view.png';
import EditIcon from '../../assets/edit.png';
import DeleteIcon from '../../assets/delete.png';
import productApi from '../../api/productApi';

const AdminProductsManagementPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchUID, setSearchUID] = useState('');

  useEffect(() => {
    loadProducts();
  }, [currentPage]);

  useEffect(() => {
    // Filter products by UID search
    if (searchUID.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.UID?.toLowerCase().includes(searchUID.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [products, searchUID]);

  useEffect(() => {
    loadProducts();
  }, [currentPage]);

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
      } else {
        // Fallback for direct array response
        const list = Array.isArray(response) ? response : [];
        setProducts(list);
        setTotalPages(Math.ceil(list.length / 10));
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
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
      setProducts(prev => prev.filter(product => 
        (product.id ?? product._id) !== productId
      ));
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

  const formatPropertyType = (type) => {
    const types = {
      'apartment': 'Căn hộ',
      'house': 'Nhà riêng',
      'villa': 'Biệt thự',
      'studio': 'Studio',
      'dormitory': 'Ký túc xá',
      'homestay': 'Homestay'
    };
    return types[type] || type;
  };

  const formatRegion = (region) => {
    const regions = {
      'north': 'Miền Bắc',
      'central': 'Miền Trung',
      'south': 'Miền Nam'
    };
    return regions[region] || region;
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
            onChange={(e) => setSearchUID(e.target.value)}
            className={styles.searchInput}
          />
          <img src={SearchIcon} alt="Tìm kiếm" className={styles.searchIcon} />
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
                {filteredProducts.map((product) => {
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

                {filteredProducts.length === 0 && searchUID.trim() === '' && (
                  <tr>
                    <td colSpan={8} className={styles.empty}>
                      <div className={styles.emptyText}>
                        Chưa có sản phẩm nào
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paging */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={styles.pageBtn}
              >
                « Trước
              </button>
              
              <span className={styles.pageInfo}>
                Trang {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={styles.pageBtn}
              >
                Sau »
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminProductsManagementPage;
