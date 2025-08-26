import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminDashboard.module.css';
import AdminDashboardBg from '../../assets/admin_dashboard_bg.avif';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const statsRef = useRef(null);

  const [dashboardData, setDashboardData] = useState({
    totalStats: {},
    bookingByStatus: [],
    productsByType: [],
    auctionByStatus: []
  });

  const [revenueData, setRevenueData] = useState([]);
  const [customerData, setCustomerData] = useState({
    newCustomers: [],
    topCustomers: [],
    usersByStatus: []
  });

  const [productData, setProductData] = useState({
    topProducts: [],
    productsByProvince: [],
    avgPriceByType: []
  });

  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchRevenueData();
    }
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch tất cả dữ liệu song song
      const [dashboardRes, customerRes, productRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats', { headers }),
        fetch('/api/admin/dashboard/customers', { headers }),
        fetch('/api/admin/dashboard/products', { headers })
      ]);

      const [dashboardData, customerData, productData] = await Promise.all([
        dashboardRes.json(),
        customerRes.json(),
        productRes.json()
      ]);

      if (dashboardData.success) setDashboardData(dashboardData.data);
      if (customerData.success) setCustomerData(customerData.data);
      if (productData.success) setProductData(productData.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`/api/admin/dashboard/revenue?period=${selectedPeriod}`, { headers });
      const data = await response.json();

      if (data.success) {
        setRevenueData(data.data);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  const scrollToStats = () => {
    statsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'confirmed': '#10b981',
      'completed': '#059669',
      'cancelled': '#ef4444',
      'expired': '#9ca3af',
      'active': '#3b82f6',
      'ended': '#6b7280'
    };
    return colors[status] || '#9ca3af';
  };

  if (loading) {
    return (
      <div className={styles.dashboardPage}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardPage}>
      {/* Banner chào mừng */}
      <section className={styles.bannerSection}>
        <img src={AdminDashboardBg} alt="Admin Dashboard Background" className={styles.backgroundImage} />
        <div className={styles.bannerOverlay}>
          <div className={styles.bannerContent}>
            <h1 className={styles.bannerTitle}>Chào mừng đến với</h1>
            <h1 className={styles.bannerTitle}>Dashboard Quản trị</h1>
            <p className={styles.bannerSubtitle}>
              Quản lý và theo dõi hoạt động của hệ thống đấu giá phòng
            </p>
            <button className={styles.scrollButton} onClick={scrollToStats}>
              Xem thống kê
              <span className={styles.scrollIcon}>↓</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section thống kê */}
      <section className={styles.statsSection} ref={statsRef}>
        <div className={styles.container}>
          {/* Thống kê tổng quan */}
          <div className={styles.statsGrid}>
            <h2 className={styles.sectionTitle}>Thống kê tổng quan</h2>
            
            <div className={styles.statsCards}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>👥</div>
                <div className={styles.statInfo}>
                  <h3>{dashboardData.totalStats.totalUsers || 0}</h3>
                  <p>Tổng khách hàng</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>🏠</div>
                <div className={styles.statInfo}>
                  <h3>{dashboardData.totalStats.totalProducts || 0}</h3>
                  <p>Tổng sản phẩm</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>⚡</div>
                <div className={styles.statInfo}>
                  <h3>{dashboardData.totalStats.totalAuctions || 0}</h3>
                  <p>Tổng đấu giá</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statInfo}>
                  <h3>{dashboardData.totalStats.totalBookings || 0}</h3>
                  <p>Tổng booking</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>💰</div>
                <div className={styles.statInfo}>
                  <h3>{formatCurrency(dashboardData.totalStats.totalRevenue || 0)}</h3>
                  <p>Tổng doanh thu</p>
                </div>
              </div>
            </div>
          </div>

          {/* Thống kê doanh thu */}
          <div className={styles.revenueSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Thống kê doanh thu</h2>
              <div className={styles.periodSelector}>
                <button 
                  className={`${styles.periodBtn} ${selectedPeriod === 'day' ? styles.active : ''}`}
                  onClick={() => setSelectedPeriod('day')}
                >
                  Ngày
                </button>
                <button 
                  className={`${styles.periodBtn} ${selectedPeriod === 'month' ? styles.active : ''}`}
                  onClick={() => setSelectedPeriod('month')}
                >
                  Tháng
                </button>
                <button 
                  className={`${styles.periodBtn} ${selectedPeriod === 'year' ? styles.active : ''}`}
                  onClick={() => setSelectedPeriod('year')}
                >
                  Năm
                </button>
              </div>
            </div>
            
            <div className={styles.chartContainer}>
              <div className={styles.chartHeader}>
                <span>Kỳ</span>
                <span>Bookings</span>
                <span>Doanh thu</span>
              </div>
              {revenueData.map((item, index) => (
                <div key={index} className={styles.chartRow}>
                  <span>{item.period}</span>
                  <span>{item.bookings}</span>
                  <span>{formatCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Thống kê giao dịch */}
          <div className={styles.transactionSection}>
            <h2 className={styles.sectionTitle}>Thống kê giao dịch và trạng thái</h2>
            
            <div className={styles.statusGrid}>
              <div className={styles.statusCard}>
                <h3>Booking theo trạng thái</h3>
                <div className={styles.statusList}>
                  {dashboardData.bookingByStatus.map((item, index) => (
                    <div key={index} className={styles.statusItem}>
                      <div 
                        className={styles.statusDot} 
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      ></div>
                      <span className={styles.statusName}>{item.status}</span>
                      <span className={styles.statusCount}>
                        {item.count} ({formatCurrency(item.totalAmount)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.statusCard}>
                <h3>Auction theo trạng thái</h3>
                <div className={styles.statusList}>
                  {dashboardData.auctionByStatus.map((item, index) => (
                    <div key={index} className={styles.statusItem}>
                      <div 
                        className={styles.statusDot} 
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      ></div>
                      <span className={styles.statusName}>{item.status}</span>
                      <span className={styles.statusCount}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Thống kê sản phẩm */}
          <div className={styles.productSection}>
            <h2 className={styles.sectionTitle}>Thống kê sản phẩm/auction</h2>
            
            <div className={styles.productGrid}>
              <div className={styles.productCard}>
                <h3>Sản phẩm theo loại</h3>
                <div className={styles.productList}>
                  {dashboardData.productsByType.map((item, index) => (
                    <div key={index} className={styles.productItem}>
                      <span>{item.type || 'Chưa phân loại'}</span>
                      <span>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.productCard}>
                <h3>Sản phẩm theo tỉnh</h3>
                <div className={styles.productList}>
                  {productData.productsByProvince.map((item, index) => (
                    <div key={index} className={styles.productItem}>
                      <span>{item.province || 'Chưa xác định'}</span>
                      <span>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.productCard}>
                <h3>Giá trung bình theo loại</h3>
                <div className={styles.productList}>
                  {productData.avgPriceByType.map((item, index) => (
                    <div key={index} className={styles.productItem}>
                      <span>{item.type || 'Chưa phân loại'}</span>
                      <span>{formatCurrency(item.avgPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Thống kê khách hàng */}
          <div className={styles.customerSection}>
            <h2 className={styles.sectionTitle}>Thống kê khách hàng</h2>
            
            <div className={styles.customerGrid}>
              <div className={styles.customerCard}>
                <h3>Top khách hàng</h3>
                <div className={styles.customerList}>
                  {customerData.topCustomers.map((customer, index) => (
                    <div key={index} className={styles.customerItem}>
                      <div className={styles.customerInfo}>
                        <span className={styles.customerName}>{customer.FullName}</span>
                        <span className={styles.customerEmail}>{customer.Email}</span>
                      </div>
                      <div className={styles.customerStats}>
                        <span>{customer.totalBookings} bookings</span>
                        <span>{formatCurrency(customer.totalSpent)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.customerCard}>
                <h3>Khách hàng theo trạng thái</h3>
                <div className={styles.statusList}>
                  {customerData.usersByStatus.map((item, index) => (
                    <div key={index} className={styles.statusItem}>
                      <div 
                        className={styles.statusDot} 
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      ></div>
                      <span className={styles.statusName}>{item.status}</span>
                      <span className={styles.statusCount}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;