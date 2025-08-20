import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { systemParametersApi } from '../../api/systemParametersApi';
import PageHeader from '../../components/PageHeader/PageHeader';
import styles from './SystemConfigPage.module.css';

export default function SystemConfigPage() {
    const navigate = useNavigate();
    const [systemParams, setSystemParams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSystemParameters();
  }, []);

  const fetchSystemParameters = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await systemParametersApi.getAllParameters();

      // Trích xuất mảng dữ liệu từ phản hồi API
      const parametersData = response.data || [];
      setSystemParams(parametersData);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải dữ liệu cấu hình hệ thống');
      setLoading(false);
    }
  };

  const handleValueChange = (paramName, newValue) => {
    setSystemParams(prev => 
      prev.map(param => 
        param.ParamName === paramName 
          ? { ...param, ParamValue: newValue }
          : param
      )
    );
  };

  const handleSave = async (param) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      console.log(`Saving parameter: ${param.ParamName} with value: ${param.ParamValue}`);

      // Gọi API để cập nhật thông số hệ thống
      const response = await systemParametersApi.updateParameter(param.ParamName, param.ParamValue);
      
      if (response.success) {
        setSuccess(`Đã cập nhật thành công: ${param.ParamName}`);
        // Reload lại dữ liệu để đảm bảo đồng bộ
        await fetchSystemParameters();
      } else {
        throw new Error(response.message || 'Không thể cập nhật tham số');
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Lỗi khi cập nhật ${param.ParamName}: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải cấu hình hệ thống...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Cấu hình hệ thống"
        crumbs={[{ label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Cấu hình hệ thống' }]}
      />

      {error && <div className={styles.alert + ' ' + styles.error}>{error}</div>}
      {success && <div className={styles.alert + ' ' + styles.success}>{success}</div>}

      <div className={styles.paramsList}>
        {systemParams.map(param => (
          <div key={param.ParamName} className={styles.paramCard}>
            <div className={styles.paramInfo}>
              <h3 className={styles.paramName}>{param.ParamName}</h3>
              {/* <p className={styles.paramDescription}>{param.Description}</p> */}
            </div>
            <div className={styles.paramControls}>
              <div className={styles.inputGroup}>
                <label>Giá trị:</label> 
                <input
                  type="text"
                  value={param.ParamValue}
                  onChange={(e) => handleValueChange(param.ParamName, e.target.value)}
                  className={styles.input}
                />
              </div>
              <button
                onClick={() => handleSave(param)}
                disabled={saving}
                className={styles.saveButton}
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
