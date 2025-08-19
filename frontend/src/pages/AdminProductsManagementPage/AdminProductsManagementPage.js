import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader/PageHeader';
import styles from './AdminProductsManagementPage.module.css';
import productApi from '../../api/productApi';

const AdminProductsManagementPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

      <div className={styles.layout}>
        <main className={styles.main}>
          {/* Action Bar */}
          <div className={styles.actionBar}>
            <div className={styles.actionLeft}>
              <h2 className={styles.pageTitle}>
                Danh sách sản phẩm ({products.length})
              </h2>
            </div>
            <div className={styles.actionRight}>
              <button 
                onClick={handleAddProduct}
                className={styles.addBtn}
              >
                + Thêm sản phẩm mới
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeader}>
                  <th>ID</th>
                  <th>Tên sản phẩm</th>
                  <th>Loại hình</th>
                  <th>Vùng miền</th>
                  <th>Số phòng ngủ</th>
                  <th>Số phòng tắm</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const id = product.id ?? product._id;
                  return (
                    <tr key={id} className={styles.row}>
                      <td>{id}</td>
                      <td>
                        <div className={styles.productInfo}>
                          <div className={styles.productName}>
                            {product.name}
                          </div>
                          {product.roomNumber && (
                            <div className={styles.roomNumber}>
                              Phòng: {product.roomNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={styles.propertyType}>
                          {formatPropertyType(product.propertyType)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.region}>
                          {formatRegion(product.region)}
                        </span>
                      </td>
                      <td className={styles.textCenter}>
                        {product.bedrooms || 1}
                      </td>
                      <td className={styles.textCenter}>
                        {product.bathrooms || 1}
                      </td>
                      <td>
                        {product.createdAt 
                          ? new Date(product.createdAt).toLocaleDateString('vi-VN')
                          : '-'
                        }
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.btnView}
                            onClick={() => navigate(`/product/${id}`)}
                            title="Xem chi tiết"
                          >
                            👁️
                          </button>
                          <button
                            className={styles.btnEdit}
                            onClick={() => handleEditProduct(id)}
                            title="Chỉnh sửa"
                          >
                            ✏️
                          </button>
                          <button
                            className={styles.btnDelete}
                            onClick={() => handleDeleteProduct(id)}
                            title="Xóa"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={8} className={styles.empty}>
                      <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📦</div>
                        <div className={styles.emptyText}>
                          Chưa có sản phẩm nào
                        </div>
                        <button 
                          onClick={handleAddProduct}
                          className={styles.emptyAddBtn}
                        >
                          Thêm sản phẩm đầu tiên
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
