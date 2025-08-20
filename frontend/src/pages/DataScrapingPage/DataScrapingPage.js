import React, { useState, useEffect } from 'react';
import { useLocation } from '../../contexts/LocationContext';
import PageHeader from '../../components/PageHeader/PageHeader';
import styles from './DataScrapingPage.module.css';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export default function DataScrapingPage() {
  const { allProvinces, loadAllLocationsData } = useLocation();
  const [activeTab, setActiveTab] = useState('listing');
  const [listingLocationName, setListingLocationName] = useState('');
  const [listingLocationNameEn, setListingLocationNameEn] = useState('');
  const [reviewLocationName, setReviewLocationName] = useState('');
  const [reviewLocationNameEn, setReviewLocationNameEn] = useState('');
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
    if (!listingLocationNameEn.trim()) {
      alert('Vui lòng chọn tỉnh');
      return;
    }

    setIsListingRunning(true);
    const timestamp = new Date().toLocaleString();
    setListingLogs(prev => [...prev, `[${timestamp}] Bắt đầu thu thập dữ liệu listing cho: ${listingLocationName} (${listingLocationNameEn})`]);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/scraping/listing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ locationName: listingLocationNameEn })
      });

      const result = await response.json();
      
      const endTimestamp = new Date().toLocaleString();
      
      if (result.success) {
        setListingLogs(prev => [...prev, `[${endTimestamp}] Hoàn thành thu thập dữ liệu listing cho: ${listingLocationName}`]);
        
        // Thêm output từ Python script vào logs nếu có
        if (result.output) {
          const outputLines = result.output.split('\n').filter(line => line.trim());
          outputLines.forEach(line => {
            setListingLogs(prev => [...prev, `[${endTimestamp}] ${line}`]);
          });
        }
      } else {
        setListingLogs(prev => [...prev, `[${endTimestamp}] Lỗi: ${result.message}`]);
      }
      
      setListingLocationName('');
      setListingLocationNameEn('');
    } catch (error) {
      const errorTimestamp = new Date().toLocaleString();
      setListingLogs(prev => [...prev, `[${errorTimestamp}] Lỗi kết nối: ${error.message}`]);
    } finally {
      setIsListingRunning(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewLocationNameEn.trim()) {
      alert('Vui lòng chọn tỉnh');
      return;
    }

    setIsReviewRunning(true);
    const timestamp = new Date().toLocaleString();
    setReviewLogs(prev => [...prev, `[${timestamp}] Bắt đầu thu thập dữ liệu review cho: ${reviewLocationName} (${reviewLocationNameEn})`]);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/scraping/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ locationName: reviewLocationNameEn })
      });

      const result = await response.json();
      
      const endTimestamp = new Date().toLocaleString();
      
      if (result.success) {
        setReviewLogs(prev => [...prev, `[${endTimestamp}] ${result.message}`]);
        
        // Thêm output từ Python script vào logs nếu có
        if (result.output) {
          const outputLines = result.output.split('\n').filter(line => line.trim());
          outputLines.forEach(line => {
            setReviewLogs(prev => [...prev, `[${endTimestamp}] ${line}`]);
          });
        }
      } else {
        setReviewLogs(prev => [...prev, `[${endTimestamp}] Lỗi: ${result.message}`]);
      }
      
      setReviewLocationName('');
      setReviewLocationNameEn('');
    } catch (error) {
      const errorTimestamp = new Date().toLocaleString();
      setReviewLogs(prev => [...prev, `[${errorTimestamp}] Lỗi kết nối: ${error.message}`]);
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
                      onChange={(e) => {
                        const selectedProvince = allProvinces.find(p => p.Name === e.target.value);
                        setListingLocationName(e.target.value);
                        setListingLocationNameEn(selectedProvince?.NameEn || '');
                      }}
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
                      onChange={(e) => {
                        const selectedProvince = allProvinces.find(p => p.Name === e.target.value);
                        setReviewLocationName(e.target.value);
                        setReviewLocationNameEn(selectedProvince?.NameEn || '');
                      }}
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
