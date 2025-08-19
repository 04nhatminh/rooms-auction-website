import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationAPI from '../../api/locationApi';
import productApi from '../../api/productApi';
import PageHeader from '../../components/PageHeader/PageHeader';

import styles from './AdminAddProductPage.module.css';

const AdminAddProductPage = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    roomNumber: '',
    bedrooms: 1,
    bathrooms: 1,
    description: '',
    region: '',
    provinceCode: '',
    districtCode: '',
    propertyType: '',
    amenities: [],
    images: []
  });

  // Data for dropdowns
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(true);

  // Property types
  const propertyTypes = [
    { value: 'apartment', label: 'Căn hộ' },
    { value: 'house', label: 'Nhà riêng' },
    { value: 'villa', label: 'Biệt thự' },
    { value: 'studio', label: 'Studio' },
    { value: 'dormitory', label: 'Ký túc xá' },
    { value: 'homestay', label: 'Homestay' }
  ];

  // Regions
  const regions = [
    { value: 'north', label: 'Miền Bắc' },
    { value: 'central', label: 'Miền Trung' },
    { value: 'south', label: 'Miền Nam' }
  ];

  // Common amenities
  const availableAmenities = [
    'WiFi miễn phí',
    'Điều hòa',
    'Tivi',
    'Tủ lạnh',
    'Máy giặt',
    'Bếp riêng',
    'Ban công',
    'Thang máy',
    'Chỗ đậu xe',
    'Bảo vệ 24/7',
    'Hồ bơi',
    'Phòng gym',
    'Spa',
    'Nhà hàng',
    'Quầy bar',
    'Dịch vụ phòng',
    'Dọn phòng hàng ngày',
    'Cho phép hút thuốc',
    'Cho phép thú cưng',
    'Gần biển',
    'Gần trung tâm',
    'Gần sân bay'
  ];

  // Load provinces and districts on component mount
  useEffect(() => {
    loadProvinces();
    loadDistricts();
  }, []);

  // Filter districts when province changes
  useEffect(() => {
    if (formData.provinceCode && districts.length > 0) {
      const filtered = districts.filter(district => 
        district.provinceCode === formData.provinceCode
      );
      setFilteredDistricts(filtered);
      // Reset district selection if current selection doesn't match new province
      if (formData.districtCode && !filtered.find(d => d.code === formData.districtCode)) {
        setFormData(prev => ({ ...prev, districtCode: '' }));
      }
    } else {
      setFilteredDistricts([]);
    }
  }, [formData.provinceCode, districts]);

  const loadProvinces = async () => {
    try {
      const response = await LocationAPI.getAllProvinces();
      if (response.success) {
        setProvinces(response.data || []);
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadDistricts = async () => {
    try {
      const response = await LocationAPI.getAllDistricts();
      if (response.success) {
        setDistricts(response.data || []);
      }
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleAmenityChange = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // For now, just store file names. In real implementation, you'd upload to server
      const imageNames = files.map(file => file.name);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageNames]
      }));
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên sản phẩm');
      return;
    }
    if (!formData.description.trim()) {
      alert('Vui lòng nhập mô tả');
      return;
    }
    if (!formData.region) {
      alert('Vui lòng chọn vùng miền');
      return;
    }
    if (!formData.provinceCode) {
      alert('Vui lòng chọn tỉnh/thành phố');
      return;
    }
    if (!formData.districtCode) {
      alert('Vui lòng chọn quận/huyện');
      return;
    }
    if (!formData.propertyType) {
      alert('Vui lòng chọn loại hình bất động sản');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Prepare data for API
      const productDataToSubmit = {
        name: formData.name.trim(),
        roomNumber: formData.roomNumber.trim(),
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        description: formData.description.trim(),
        region: formData.region,
        provinceCode: formData.provinceCode,
        districtCode: formData.districtCode,
        propertyType: formData.propertyType,
        amenities: formData.amenities,
        images: formData.images
      };

      await productApi.createProduct(productDataToSubmit, token);
      alert('Tạo sản phẩm thành công!');
      navigate('/admin/products-management');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Có lỗi xảy ra khi tạo sản phẩm: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Bạn có chắc muốn hủy? Dữ liệu đã nhập sẽ bị mất.')) {
      navigate('/admin/products-management');
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Thêm sản phẩm mới"
        crumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Quản lý sản phẩm', to: '/admin/products-management' },
          { label: 'Thêm sản phẩm mới' }
        ]}
      />

      <div className={styles.layout}>
        <main className={styles.main}>
          <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.form}>
              
              {/* Basic Information */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Thông tin cơ bản</h3>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Tên sản phẩm <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Nhập tên phòng/nhà/căn hộ"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số phòng</label>
                    <input
                      type="text"
                      name="roomNumber"
                      value={formData.roomNumber}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="VD: A101, B205..."
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số phòng ngủ</label>
                    <select
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num} phòng</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số phòng tắm</label>
                    <select
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num} phòng</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Mô tả <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    placeholder="Nhập mô tả chi tiết về sản phẩm..."
                    rows={4}
                    required
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Thông tin vị trí</h3>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Vùng miền <span className={styles.required}>*</span>
                    </label>
                    <select
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      className={styles.select}
                      required
                    >
                      <option value="">Chọn vùng miền</option>
                      {regions.map(region => (
                        <option key={region.value} value={region.value}>
                          {region.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Loại hình bất động sản <span className={styles.required}>*</span>
                    </label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className={styles.select}
                      required
                    >
                      <option value="">Chọn loại hình</option>
                      {propertyTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Tỉnh/Thành phố <span className={styles.required}>*</span>
                    </label>
                    <select
                      name="provinceCode"
                      value={formData.provinceCode}
                      onChange={handleInputChange}
                      className={styles.select}
                      required
                      disabled={loadingProvinces}
                    >
                      <option value="">
                        {loadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
                      </option>
                      {provinces.map(province => (
                        <option key={province.code} value={province.code}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Quận/Huyện <span className={styles.required}>*</span>
                    </label>
                    <select
                      name="districtCode"
                      value={formData.districtCode}
                      onChange={handleInputChange}
                      className={styles.select}
                      required
                      disabled={!formData.provinceCode || loadingDistricts}
                    >
                      <option value="">
                        {!formData.provinceCode 
                          ? 'Chọn tỉnh/thành phố trước'
                          : loadingDistricts 
                          ? 'Đang tải...'
                          : 'Chọn quận/huyện'
                        }
                      </option>
                      {filteredDistricts.map(district => (
                        <option key={district.code} value={district.code}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Tiện nghi</h3>
                <div className={styles.amenitiesGrid}>
                  {availableAmenities.map(amenity => (
                    <label key={amenity} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleAmenityChange(amenity)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxText}>{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Hình ảnh</h3>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Upload hình ảnh</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={styles.fileInput}
                  />
                  <p className={styles.helpText}>
                    Chọn nhiều hình ảnh cùng lúc. Hỗ trợ JPG, PNG, GIF.
                  </p>
                </div>

                {formData.images.length > 0 && (
                  <div className={styles.imagePreview}>
                    <h4>Hình ảnh đã chọn:</h4>
                    <div className={styles.imageList}>
                      {formData.images.map((image, index) => (
                        <div key={index} className={styles.imageItem}>
                          <span className={styles.imageName}>{image}</span>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className={styles.removeImageBtn}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <button
                  type="button"
                  onClick={handleCancel}
                  className={styles.cancelBtn}
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? 'Đang tạo...' : 'Tạo sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminAddProductPage;
