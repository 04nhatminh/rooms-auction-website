import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { statisticsApi } from '../../api/statisticsApi';
import LineChart from '../../components/Charts/LineChart';
import ColumnChart from '../../components/Charts/ColumnChart';
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
  const [bookingData, setBookingData] = useState([]);
  const [bidsData, setBidsData] = useState([]);
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
      fetchTimeBasedData();
    }
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      // Sử dụng statisticsApi thay vì gọi API trực tiếp
      const allStats = await statisticsApi.getAllStats();
      
      if (allStats.success) {
        setDashboardData(allStats.data.dashboard);
        setCustomerData(allStats.data.customers);
        setProductData(allStats.data.products);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeBasedData = async () => {
    try {
      const [revenueStats, bookingStats, bidsStats] = await Promise.all([
        statisticsApi.getRevenueStats(selectedPeriod),
        statisticsApi.getBookingStats(selectedPeriod),
        statisticsApi.getBidsStats(selectedPeriod)
      ]);
      
      if (revenueStats.success) {
        setRevenueData(revenueStats.data);
      }
      
      if (bookingStats.success) {
        setBookingData(bookingStats.data);
      }
      
      if (bidsStats.success) {
        setBidsData(bidsStats.data);
      }
    } catch (error) {
      console.error('Error fetching time-based data:', error);
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

  const getPeriodLabel = (period, periodType) => {
    switch (periodType) {
      case 'day':
        return `Ngày ${period}`;
      case 'month':
        return `Tháng ${period}`;
      case 'year':
        return `Năm ${period}`;
      default:
        return period;
    }
  };

  const prepareChartData = (data, dataKey, label, color) => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const periods = data.map(item => getPeriodLabel(item.period, selectedPeriod));
    const values = data.map(item => item[dataKey] || 0);

    return {
      labels: periods,
      datasets: [
        {
          label: label,
          data: values,
          borderColor: color,
          backgroundColor: color.replace('1)', '0.1)'),
          borderWidth: 2,
          fill: true,
          tension: 0.1,
        }
      ]
    };
  };

  const prepareColumnChartData = (data, dataKey, label, color) => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const periods = data.map(item => getPeriodLabel(item.period, selectedPeriod));
    const values = data.map(item => item[dataKey] || 0);

    return {
      labels: periods,
      datasets: [
        {
          label: label,
          data: values,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'confirmed': '#10b981',
      'completed': '#059669',
      'cancelled': '#ef4444',
      'expired': '#9ca3af',
      'active': '#3bf679ff',
      'ended': '#6b7280'
    };
    return colors[status] || '#9ca3af';
  };

  if (loading) {
    return (
      <div className={styles.dashboardPage}>
        <section className={styles.bannerSection}>
          <img src={AdminDashboardBg} alt="Admin Dashboard Background" className={styles.backgroundImage} />
          <div className={styles.bannerOverlay}>
            <div className={styles.bannerContent}>
              <h1 className={styles.bannerTitle}>Chào mừng đến với</h1>
              <h1 className={styles.bannerTitle}>Dashboard Quản trị</h1>
              <p className={styles.bannerSubtitle}>
                Quản lý và theo dõi hoạt động của hệ thống đấu giá phòng Bidstay
              </p>
              <button className={styles.scrollButton} onClick={scrollToStats}>
                Xem thống kê
                <span className={styles.scrollIcon}>↓</span>
              </button>
            </div>
          </div>
        </section>
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
              Quản lý và theo dõi hoạt động của hệ thống đấu giá phòng Bidstay
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
            
            <LineChart
              data={prepareChartData(revenueData, 'revenue', 'Doanh thu (VND)', 'rgba(34, 197, 94, 1)')}
              title={`Biểu đồ doanh thu theo ${selectedPeriod === 'day' ? 'ngày' : selectedPeriod === 'month' ? 'tháng' : 'năm'}`}
              yAxisLabel="Doanh thu (VND)"
            />
          </div>

          {/* Thống kê số lượt booking */}
          <div className={styles.bookingSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Thống kê số lượt booking</h2>
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
            
            <ColumnChart
              data={prepareColumnChartData(bookingData, 'bookings', 'Số lượt booking', 'rgba(59, 130, 246, 0.8)')}
              title={`Biểu đồ số lượt booking theo ${selectedPeriod === 'day' ? 'ngày' : selectedPeriod === 'month' ? 'tháng' : 'năm'}`}
              yAxisLabel="Số lượt booking"
            />
          </div>

          {/* Thống kê lượt tham gia đấu giá (Bids) */}
          <div className={styles.bidsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Thống kê lượt tham gia đấu giá (Bids)</h2>
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
            
            <LineChart
              data={prepareChartData(bidsData, 'bids', 'Số lượt bid', 'rgba(168, 85, 247, 1)')}
              title={`Biểu đồ lượt tham gia đấu giá theo ${selectedPeriod === 'day' ? 'ngày' : selectedPeriod === 'month' ? 'tháng' : 'năm'}`}
              yAxisLabel="Số lượt bid"
            />
          </div>

          {/* Thống kê theo trạng thái*/}
          <div className={styles.transactionSection}>
            <h2 className={styles.sectionTitle}>Thống kê theo trạng thái</h2>
            
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
                <h3>Đấu giá theo trạng thái</h3>
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
            <h2 className={styles.sectionTitle}>Thống kê sản phẩm</h2>
            
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