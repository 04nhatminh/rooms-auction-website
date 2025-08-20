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

  // Mock data - replace with actual API call
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

  const handleValueChange = (paramId, newValue) => {
    setSystemParams(prev => 
      prev.map(param => 
        param.ParamID === paramId 
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

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/system-parameters/${param.ParamID}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify({ ParamValue: param.ParamValue })
      // });

      // if (!response.ok) {
      //   throw new Error('Không thể cập nhật tham số');
      // }

      setSuccess(`Đã cập nhật thành công: ${param.ParamName}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Lỗi khi cập nhật ${param.ParamName}: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (param) => {
    switch (param.DataType) {
      case 'boolean':
        return (
          <select
            value={param.ParamValue}
            onChange={(e) => handleValueChange(param.ParamID, e.target.value)}
            className={styles.input}
          >
            <option value="true">Bật</option>
            <option value="false">Tắt</option>
          </select>
        );
      case 'number':
        return (
          <input
            type="number"
            value={param.ParamValue}
            onChange={(e) => handleValueChange(param.ParamID, e.target.value)}
            className={styles.input}
            step="any"
          />
        );
      default:
        return (
          <input
            type="text"
            value={param.ParamValue}
            onChange={(e) => handleValueChange(param.ParamID, e.target.value)}
            className={styles.input}
          />
        );
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
          <div key={param.ParamID} className={styles.paramCard}>
            <div className={styles.paramInfo}>
              <h3 className={styles.paramName}>{param.ParamName}</h3>
              <p className={styles.paramDescription}>{param.Description}</p>
            </div>
            <div className={styles.paramControls}>
              <div className={styles.inputGroup}>
                <label>Giá trị:</label>
                {renderInput(param)}
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
