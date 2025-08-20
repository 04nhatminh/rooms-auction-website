import React, { useState, useEffect } from 'react';
import { useLocation } from '../../contexts/LocationContext';
import PageHeader from '../../components/PageHeader/PageHeader';
import styles from './DataScrapingPage.module.css';

export default function DataScrapingPage() {
  const { allProvinces, loadAllLocationsData } = useLocation();
  const [activeTab, setActiveTab] = useState('listing');
  const [listingLocationName, setListingLocationName] = useState('');
  const [reviewLocationName, setReviewLocationName] = useState('');
  const [isListingRunning, setIsListingRunning] = useState(false);
  const [isReviewRunning, setIsReviewRunning] = useState(false);
  const [listingLogs, setListingLogs] = useState([]);
  const [reviewLogs, setReviewLogs] = useState([]);

  // Load provinces data when component mounts
  useEffect(() => {
    loadAllLocationsData();
  }, [loadAllLocationsData]);

  const handleListingSubmit = async (e) => {
    e.preventDefault();
    if (!listingLocationName.trim()) {
      alert('Vui lòng nhập tên tỉnh');
      return;
    }

    setIsListingRunning(true);
    const timestamp = new Date().toLocaleString();
    setListingLogs(prev => [...prev, `[${timestamp}] Bắt đầu thu thập dữ liệu listing cho: ${listingLocationName}`]);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/scraping/listing', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify({ locationName: listingLocationName })
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const endTimestamp = new Date().toLocaleString();
      setListingLogs(prev => [...prev, `[${endTimestamp}] Hoàn thành thu thập dữ liệu listing cho: ${listingLocationName}`]);
      setListingLocationName('');
    } catch (error) {
      const errorTimestamp = new Date().toLocaleString();
      setListingLogs(prev => [...prev, `[${errorTimestamp}] Lỗi: ${error.message}`]);
    } finally {
      setIsListingRunning(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewLocationName.trim()) {
      alert('Vui lòng nhập tên tỉnh');
      return;
    }

    setIsReviewRunning(true);
    const timestamp = new Date().toLocaleString();
    setReviewLogs(prev => [...prev, `[${timestamp}] Bắt đầu thu thập dữ liệu review cho: ${reviewLocationName}`]);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/scraping/review', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify({ locationName: reviewLocationName })
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const endTimestamp = new Date().toLocaleString();
      setReviewLogs(prev => [...prev, `[${endTimestamp}] Hoàn thành thu thập dữ liệu review cho: ${reviewLocationName}`]);
      setReviewLocationName('');
    } catch (error) {
      const errorTimestamp = new Date().toLocaleString();
      setReviewLogs(prev => [...prev, `[${errorTimestamp}] Lỗi: ${error.message}`]);
    } finally {
      setIsReviewRunning(false);
    }
  };

  const clearLogs = (type) => {
    if (type === 'listing') {
      setListingLogs([]);
    } else {
      setReviewLogs([]);
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Thu thập dữ liệu"
        crumbs={[{ label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Thu thập dữ liệu' }]}
      />

      <div className={styles.tabContainer}>
        <div className={styles.tabHeader}>
          <button
            className={`${styles.tabButton} ${activeTab === 'listing' ? styles.active : ''}`}
            onClick={() => setActiveTab('listing')}
          >
            Listing Info
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'review' ? styles.active : ''}`}
            onClick={() => setActiveTab('review')}
          >
            Review
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'listing' && (
            <div className={styles.tabPane}>
              <div className={styles.formSection}>
                <form onSubmit={handleListingSubmit} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="listingLocation">Chọn tỉnh muốn thu thập:</label>
                    <select
                      id="listingLocation"
                      value={listingLocationName}
                      onChange={(e) => setListingLocationName(e.target.value)}
                      className={styles.input}
                      disabled={isListingRunning}
                    >
                      <option value="">Chọn tỉnh muốn thu thập...</option>
                      {allProvinces.map((province) => (
                        <option key={province.id} value={province.Name}>
                          {province.Name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isListingRunning}
                    className={`${styles.submitButton} ${isListingRunning ? styles.running : ''}`}
                  >
                    {isListingRunning ? (
                      <>
                        <span className={styles.spinner}></span>
                        Đang chạy...
                      </>
                    ) : (
                      'Thực thi'
                    )}
                  </button>
                </form>
              </div>

              <div className={styles.logSection}>
                <div className={styles.logHeader}>
                  <h4>Logs</h4>
                  <button
                    onClick={() => clearLogs('listing')}
                    className={styles.clearButton}
                    disabled={isListingRunning}
                  >
                    Xóa logs
                  </button>
                </div>
                <div className={styles.logContainer}>
                  {listingLogs.length === 0 ? (
                    <div className={styles.noLogs}>Chưa có logs</div>
                  ) : (
                    listingLogs.map((log, index) => (
                      <div key={index} className={styles.logItem}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'review' && (
            <div className={styles.tabPane}>
              <div className={styles.formSection}>
                <form onSubmit={handleReviewSubmit} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="reviewLocation">Chọn tỉnh muốn thu thập:</label>
                    <select
                      id="reviewLocation"
                      value={reviewLocationName}
                      onChange={(e) => setReviewLocationName(e.target.value)}
                      className={styles.input}
                      disabled={isReviewRunning}
                    >
                      <option value="">Chọn tỉnh muốn thu thập...</option>
                      {allProvinces.map((province) => (
                        <option key={province.id} value={province.Name}>
                          {province.Name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isReviewRunning}
                    className={`${styles.submitButton} ${isReviewRunning ? styles.running : ''}`}
                  >
                    {isReviewRunning ? (
                      <>
                        <span className={styles.spinner}></span>
                        Đang chạy...
                      </>
                    ) : (
                      'Thực thi'
                    )}
                  </button>
                </form>
              </div>

              <div className={styles.logSection}>
                <div className={styles.logHeader}>
                  <h4>Logs</h4>
                  <button
                    onClick={() => clearLogs('review')}
                    className={styles.clearButton}
                    disabled={isReviewRunning}
                  >
                    Xóa logs
                  </button>
                </div>
                <div className={styles.logContainer}>
                  {reviewLogs.length === 0 ? (
                    <div className={styles.noLogs}>Chưa có logs</div>
                  ) : (
                    reviewLogs.map((log, index) => (
                      <div key={index} className={styles.logItem}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
