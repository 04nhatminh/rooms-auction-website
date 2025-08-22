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
    roomType: '',
    roomNumber: '',
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    maxGuests: 1,
    descriptions: [{ title: null, htmlText: '' }],
    provinceCode: '',
    districtCode: '',
    address: '',
    propertyType: '',
    amenities: [],
    houseRules: [''],
    safetyProperties: [''],
    images: [],
    price: ''
  });

  // Data for dropdowns
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [amenityGroups, setAmenityGroups] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingPropertyTypes, setLoadingPropertyTypes] = useState(true);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(true);
  const [loadingAmenities, setLoadingAmenities] = useState(true);

  // Load provinces, districts, and other data on component mount
  useEffect(() => {
    loadProvinces();
    loadDistricts();
    loadPropertyTypes();
    loadRoomTypes();
    loadAmenityGroups();
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

  const loadPropertyTypes = async () => {
    try {
      const response = await productApi.getPropertyTypes();
      if (response.success) {
        setPropertyTypes(response.data || []);
      }
    } catch (error) {
      console.error('Error loading property types:', error);
    } finally {
      setLoadingPropertyTypes(false);
    }
  };

  const loadRoomTypes = async () => {
    try {
      const response = await productApi.getRoomTypes();
      if (response.success) {
        setRoomTypes(response.data || []);
      }
    } catch (error) {
      console.error('Error loading room types:', error);
    } finally {
      setLoadingRoomTypes(false);
    }
  };

  const loadAmenityGroups = async () => {
    try {
      const response = await productApi.getAmenityGroups();
      if (response.success) {
        setAmenityGroups(response.data || []);
      }
    } catch (error) {
      console.error('Error loading amenity groups:', error);
    } finally {
      setLoadingAmenities(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleDescriptionChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      descriptions: prev.descriptions.map((desc, i) => 
        i === index ? { ...desc, [field]: value } : desc
      )
    }));
  };

  const addDescription = () => {
    setFormData(prev => ({
      ...prev,
      descriptions: [...prev.descriptions, { title: '', htmlText: '' }]
    }));
  };

  const removeDescription = (index) => {
    if (formData.descriptions.length > 1) {
      setFormData(prev => ({
        ...prev,
        descriptions: prev.descriptions.filter((_, i) => i !== index)
      }));
    }
  };

  const handlePolicyChange = (type, index, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((policy, i) => i === index ? value : policy)
    }));
  };

  const addPolicy = (type) => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const removePolicy = (type, index) => {
    if (formData[type].length > 1) {
      setFormData(prev => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      }));
    }
  };

  const handleAmenityChange = (amenityId) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
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
    if (!formData.roomType) {
      alert('Vui lòng chọn loại chỗ ở');
      return;
    }
    if (!formData.descriptions[0].htmlText.trim()) {
      alert('Vui lòng nhập mô tả');
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
    if (!formData.address.trim()) {
      alert('Vui lòng nhập địa chỉ');
      return;
    }
    if (!formData.propertyType) {
      alert('Vui lòng chọn loại hình bất động sản');
      return;
    }
    if (!formData.price) {
      alert('Vui lòng nhập giá phòng');
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
        roomType: formData.roomType,
        roomNumber: formData.roomNumber.trim(),
        bedrooms: formData.bedrooms,
        beds: formData.beds,
        bathrooms: formData.bathrooms,
        maxGuests: formData.maxGuests,
        descriptions: formData.descriptions.filter(desc => desc.htmlText.trim()),
        provinceCode: formData.provinceCode,
        districtCode: formData.districtCode,
        address: formData.address.trim(),
        propertyType: formData.propertyType,
        amenities: formData.amenities,
        houseRules: formData.houseRules.filter(rule => rule.trim()),
        safetyProperties: formData.safetyProperties.filter(prop => prop.trim()),
        images: formData.images,
        price: formData.price
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
                  <label className={styles.label}>
                    Loại chỗ ở <span className={styles.required}>*</span>
                  </label>
                  <select
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleInputChange}
                    className={styles.select}
                    required
                    disabled={loadingRoomTypes}
                  >
                    <option value="">
                      {loadingRoomTypes ? 'Đang tải...' : 'Chọn loại chỗ ở'}
                    </option>
                    {roomTypes.map(type => (
                      <option key={type.RoomTypeID} value={type.RoomTypeID}>
                        {type.RoomTypeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Hình thức chỗ ở <span className={styles.required}>*</span>
                  </label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    className={styles.select}
                    required
                    disabled={loadingPropertyTypes}
                  >
                    <option value="">
                      {loadingPropertyTypes ? 'Đang tải...' : 'Chọn loại hình'}
                    </option>
                    {propertyTypes.map(type => (
                      <option key={type.PropertyID} value={type.PropertyID}>
                        {type.PropertyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Số phòng</label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Nhập số phòng (ví dụ: 101, A-201)"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số phòng ngủ</label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Nhập số phòng ngủ"
                      min="0"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số giường ngủ</label>
                    <input
                      type="number"
                      name="beds"
                      value={formData.beds}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Nhập số giường ngủ"
                      min="0"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số phòng tắm</label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Nhập số phòng tắm"
                      min="0"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số khách tối đa</label>
                    <input
                      type="number"
                      name="maxGuests"
                      value={formData.maxGuests}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Nhập số khách tối đa"
                      min="1"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Giá phòng (VND) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Nhập giá phòng"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Mô tả</h3>
                {formData.descriptions.map((description, index) => (
                  <div key={index} className={styles.descriptionGroup}>
                    {index === 0 ? (
                      <div className={styles.formGroup}>
                        <label className={styles.label}>
                          Mô tả chính <span className={styles.required}>*</span>
                        </label>
                        <textarea
                          value={description.htmlText}
                          onChange={(e) => handleDescriptionChange(index, 'htmlText', e.target.value)}
                          className={styles.textarea}
                          placeholder="Nhập mô tả chi tiết về sản phẩm..."
                          rows={4}
                          required
                        />
                      </div>
                    ) : (
                      <div className={styles.formGroup}>
                        <div className={styles.descriptionHeader}>
                          <label className={styles.label}>Mô tả #{index + 1}</label>
                          <button
                            type="button"
                            onClick={() => removeDescription(index)}
                            className={styles.removeDescBtn}
                          >
                            ×
                          </button>
                        </div>
                        <input
                          type="text"
                          value={description.title}
                          onChange={(e) => handleDescriptionChange(index, 'title', e.target.value)}
                          className={styles.input}
                          placeholder="Nhập tiêu đề mô tả..."
                          style={{ marginBottom: '8px' }}
                        />
                        <textarea
                          value={description.htmlText}
                          onChange={(e) => handleDescriptionChange(index, 'htmlText', e.target.value)}
                          className={styles.textarea}
                          placeholder="Nhập nội dung mô tả..."
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDescription}
                  className={styles.addDescBtn}
                >
                  + Thêm mô tả
                </button>
              </div>

              {/* Location Information */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Thông tin vị trí</h3>

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
                          {province.Name}
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
                          {district.Name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Địa chỉ <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Nhập địa chỉ"
                    required
                  />
                </div>
              </div>

              {/* Amenities */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Tiện nghi</h3>
                {loadingAmenities ? (
                  <p>Đang tải tiện nghi...</p>
                ) : (
                  amenityGroups.map(group => (
                    <div key={group.AmenityGroupID} className={styles.amenityGroup}>
                      <h4 className={styles.amenityGroupTitle}>{group.AmenityGroupName}</h4>
                      <div className={styles.amenitiesGrid}>
                        {group.Amenities && group.Amenities.map(amenity => (
                          <label key={amenity.AmenityID} className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={formData.amenities.includes(amenity.AmenityID)}
                              onChange={() => handleAmenityChange(amenity.AmenityID)}
                              className={styles.checkbox}
                            />
                            <span className={styles.checkboxText}>{amenity.AmenityName}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Policies */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Chính sách</h3>
                
                <div className={styles.policySection}>
                  <h4 className={styles.policyTitle}>Nội quy nhà</h4>
                  {formData.houseRules.map((rule, index) => (
                    <div key={index} className={styles.policyItem}>
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => handlePolicyChange('houseRules', index, e.target.value)}
                        className={styles.input}
                        placeholder="Nhập nội quy nhà..."
                      />
                      {formData.houseRules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePolicy('houseRules', index)}
                          className={styles.removePolicyBtn}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addPolicy('houseRules')}
                    className={styles.addPolicyBtn}
                  >
                    + Thêm nội quy
                  </button>
                </div>

                <div className={styles.policySection}>
                  <h4 className={styles.policyTitle}>An toàn và chỗ ở</h4>
                  {formData.safetyProperties.map((property, index) => (
                    <div key={index} className={styles.policyItem}>
                      <input
                        type="text"
                        value={property}
                        onChange={(e) => handlePolicyChange('safetyProperties', index, e.target.value)}
                        className={styles.input}
                        placeholder="Nhập chính sách an toàn..."
                      />
                      {formData.safetyProperties.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePolicy('safetyProperties', index)}
                          className={styles.removePolicyBtn}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addPolicy('safetyProperties')}
                    className={styles.addPolicyBtn}
                  >
                    + Thêm chính sách an toàn
                  </button>
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

              {/* Submit Buttons */}
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
