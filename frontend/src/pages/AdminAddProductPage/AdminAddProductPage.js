import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationAPI from '../../api/locationApi';
import productApi from '../../api/productApi';
import PageHeader from '../../components/PageHeader/PageHeader';
import Location from '../../components/Location/Location';
import ChevronUpIcon from '../../assets/up.png'
import ChevronDownIcon from '../../assets/down.png'
import styles from './AdminAddProductPage.module.css';

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const AdminAddProductPage = ({ type = 'add', product = null }) => {
  const navigate = useNavigate();
  
  // Original product data for comparison (used in edit mode)
  const [originalFormData, setOriginalFormData] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    uid: '',
    productId: '',
    name: '',
    roomType: '',
    propertyType: '',
    bedrooms: '',
    beds: '',
    bathrooms: '',
    maxGuests: '',
    price: '',
    descriptions: [{ title: null, htmlText: '' }],
    provinceCode: '',
    districtCode: '',
    address: '',
    latitude: '',
    longitude: '',
    amenities: [],
    houseRules: [''],
    safetyProperties: [''],
    imageGroups: [{ title: '', images: [], files: [], hasExistingImages: false }]
  });

  // Data for dropdowns
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [amenityGroups, setAmenityGroups] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingPropertyTypes, setLoadingPropertyTypes] = useState(true);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(true);
  const [loadingAmenityGroups, setLoadingAmenityGroups] = useState(true);
  const [loadingAmenities, setLoadingAmenities] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Amenity groups collapse state
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Check if form data has changed (for edit mode)
  const [hasChanges, setHasChanges] = useState(false);

  // Loading states for update
  const [updating, setUpdating] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [deletingRoomTour, setDeletingRoomTour] = useState(false);

  // Determine if fields should be disabled
  const isDisabled = type === 'view';

  // Load provinces, districts, and other data on component mount
  useEffect(() => {
    loadProvinces();
    loadDistricts();
    loadPropertyTypes();
    loadRoomTypes();
    loadAmenityGroups();
    loadAmenities();
  }, []);

  // Load product data when in view or edit mode
  useEffect(() => {
    if ((type === 'view' || type === 'edit') && product) {
      loadProductData(product);
    }
  }, [type, product]);

  // Function to load product data into form
  const loadProductData = (productData) => {
    // 1) Chuẩn hoá dữ liệu đầu vào (trường hợp response là {success, data})
    let actualData = productData;
    if (productData && productData.success && productData.data) {
      actualData = productData.data;
    }

    // Kiểm tra dữ liệu an toàn
    if (!actualData) {
      console.error('Không có dữ liệu sản phẩm');
      alert('Không thể tải dữ liệu sản phẩm. Vui lòng thử lại.');
      return;
    }

    // 2) Tách các phần dữ liệu với kiểm tra an toàn
    const details         = actualData.details || actualData || {};
    const amenitiesData   = Array.isArray(actualData.amenities) ? actualData.amenities : [];
    const descriptionsRes = Array.isArray(actualData.description) ? actualData.description : [];
    const imagesData      = Array.isArray(actualData.images) ? actualData.images : [];
    const roomTourImages  = Array.isArray(actualData.roomTourImages) ? actualData.roomTourImages : [];
    const policiesData    = actualData.policies || {};

    // 3) Map amenity ids
    const amenityIds = amenitiesData.map(amenity =>
      amenity.AmenityID || amenity.amenityId || amenity.id || amenity
    );

    // 4) Map descriptions
    const descriptions = descriptionsRes.length > 0
      ? descriptionsRes.map(desc => ({
          title: desc.title || null,
          htmlText: desc.htmlText || desc.content || desc.text || ''
        }))
      : [{ title: null, htmlText: '' }];

    // 5) Map policies
    const houseRules = Array.isArray(policiesData.house_rules) && policiesData.house_rules.length > 0
      ? policiesData.house_rules
      : [''];

    const safetyProperties = Array.isArray(policiesData.safety_properties) && policiesData.safety_properties.length > 0
      ? policiesData.safety_properties
      : [''];

    // 6) Chuẩn hoá ảnh: tạo map { id -> baseUrl } để tra nhanh
    //    Đồng thời hỗ trợ trường hợp image có field khác (url/src) hoặc đã là string URL.
    const imageMap = {};
    if (Array.isArray(imagesData)) {
      imagesData.forEach(img => {
        if (!img) return;
        const id = img.id || img.imageId || img.ImageID;
        const url = img.baseUrl || img.url || img.src || (typeof img === 'string' ? img : '');
        if (id && url) imageMap[id] = url;
      });
    }
    
    // 7) Tạo imageGroups theo roomTourImages (title + imageIds). Nếu không có thì fallback gom tất cả ảnh vào 1 group.
    let imageGroups = [{ title: '', images: [], files: [] }];

    if (Array.isArray(roomTourImages) && roomTourImages.length > 0) {
      imageGroups = roomTourImages.map(rt => {
        if (!rt) return { title: '', images: [], files: [], hasExistingImages: false };
        
        const urls = Array.isArray(rt.imageIds)
          ? rt.imageIds
              .map(id => imageMap[id])
              .filter(Boolean)
          : [];

        return {
          title: rt.title || '',
          imageIds: rt.imageIds || [],
          images: urls,   // chứa URL ảnh để hiển thị trực tiếp
          files: [],      // rỗng vì ảnh này là ảnh đã có sẵn trên server (không phải file upload mới)
          hasExistingImages: urls.length > 0  // track việc có ảnh cũ
        };
      });

      // Trong trường hợp có imageIds không khớp id nào: vẫn giữ group nhưng có thể rỗng
      // Nếu tất cả group đều rỗng (thi thoảng dữ liệu thiếu), fallback gom tất cả ảnh
      const anyHasImage = imageGroups.some(g => g.images.length > 0);
      if (!anyHasImage && Array.isArray(imagesData) && imagesData.length > 0) {
        imageGroups = [{
          title: 'Hình ảnh sản phẩm',
          imageIds: [],
          images: imagesData.map(img => {
            if (!img) return '';
            return img.baseUrl || img.url || img.src || (typeof img === 'string' ? img : '');
          }).filter(Boolean),
          files: [],
          hasExistingImages: true
        }];
      }
    } else if (Array.isArray(imagesData) && imagesData.length > 0) {
      // Fallback: không có roomTourImages
      imageGroups = [{
        title: 'Hình ảnh sản phẩm',
        imageIds: [],
        images: imagesData.map(img => {
          if (!img) return '';
          return img.baseUrl || img.url || img.src || (typeof img === 'string' ? img : '');
        }).filter(Boolean),
        files: [],
        hasExistingImages: true
      }];
    }

    // 8) Gán vào formData
    const loadedFormData = {
      uid:         details.UID          || details.uid          || '',
      productId:   details.ProductID    || details.productId    || '',
      name:        details.Name        || details.name        || '',
      roomType:    details.RoomType    || details.roomType    || '',
      propertyType:details.PropertyType|| details.propertyType|| '',
      bedrooms:    details.NumBedrooms || details.bedrooms    || '',
      beds:        details.NumBeds     || details.beds        || '',
      bathrooms:   details.NumBathrooms|| details.bathrooms   || '',
      maxGuests:   details.MaxGuests   || details.maxGuests   || '',
      price:       details.Price       || details.price       || '',
      descriptions,
      provinceCode: details.ProvinceCode || details.provinceCode || '',
      districtCode: details.DistrictCode || details.districtCode || '',
      address:      details.Address      || details.address      || '',
      latitude:     details.Latitude     || details.latitude     || '',
      longitude:    details.Longitude    || details.longitude    || '',
      amenities: amenityIds,
      houseRules,
      safetyProperties,
      imageGroups
    };

    setFormData(loadedFormData);

    // 9) Lưu lại bản gốc để so sánh trong chế độ edit
    if (type === 'edit') {
      setOriginalFormData(JSON.parse(JSON.stringify(loadedFormData)));
    }
  };


  // Check for changes in edit mode
  useEffect(() => {
    if (type === 'edit' && originalFormData) {
      const currentDataString = JSON.stringify(formData);
      const originalDataString = JSON.stringify(originalFormData);
      setHasChanges(currentDataString !== originalDataString);
    }
  }, [formData, originalFormData, type]);

  // Initialize collapsed state for all amenity groups (default to collapsed)
  useEffect(() => {
    if (amenityGroups.length > 0) {
      const initialCollapsedState = {};
      amenityGroups.forEach(group => {
        initialCollapsedState[group.AmenityGroupID] = true; // true = collapsed
      });
      setCollapsedGroups(initialCollapsedState);
    }
  }, [amenityGroups]);

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
      if (response && response.success && Array.isArray(response.data)) {
        setProvinces(response.data);
      } else {
        console.error('Không thể tải danh sách tỉnh:', response);
        setProvinces([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách tỉnh:', error);
      setProvinces([]);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadDistricts = async () => {
    try {
      const response = await LocationAPI.getAllDistricts();
      if (response && response.success && Array.isArray(response.data)) {
        setDistricts(response.data);
      } else {
        console.error('Không thể tải danh sách quận/huyện:', response);
        setDistricts([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách quận/huyện:', error);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadPropertyTypes = async () => {
    try {
      const response = await productApi.getPropertyTypes();
      if (response && response.success && Array.isArray(response.data)) {
        setPropertyTypes(response.data);
      } else {
        console.error('Không thể tải danh sách loại hình chỗ ở:', response);
        setPropertyTypes([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách loại hình chỗ ở:', error);
      setPropertyTypes([]);
    } finally {
      setLoadingPropertyTypes(false);
    }
  };

  const loadRoomTypes = async () => {
    try {
      const response = await productApi.getRoomTypes();
      if (response && response.success && Array.isArray(response.data)) {
        setRoomTypes(response.data);
      } else {
        console.error('Không thể tải danh sách loại chỗ ở:', response);
        setRoomTypes([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách loại chỗ ở:', error);
      setRoomTypes([]);
    } finally {
      setLoadingRoomTypes(false);
    }
  };

  const loadAmenityGroups = async () => {
    try {
      const response = await productApi.getAmenityGroups();
      if (response && response.success && Array.isArray(response.data)) {
        setAmenityGroups(response.data);
      } else {
        console.error('Không thể tải danh sách nhóm tiện nghi:', response);
        setAmenityGroups([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách nhóm tiện nghi:', error);
      setAmenityGroups([]);
    } finally {
      setLoadingAmenityGroups(false);
    }
  };

  const loadAmenities = async () => {
    try {
      const response = await productApi.getAmenities();
      if (response && response.success && Array.isArray(response.data)) {
        setAmenities(response.data);
      } else {
        console.error('Không thể tải danh sách tiện nghi:', response);
        setAmenities([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách tiện nghi:', error);
      setAmenities([]);
    } finally {
      setLoadingAmenities(false);
    }
  };

  const preventNumberScroll = (e) => {
    e.currentTarget.blur(); // bỏ focus để wheel không tăng/giảm số
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseInt(value, 10) || 1) : value
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

  // Map amenities với groups
  const getAmenitiesByGroup = () => {
    const groupedAmenities = {};
    
    // Kiểm tra dữ liệu an toàn
    if (!Array.isArray(amenityGroups) || !Array.isArray(amenities)) {
      return [];
    }
    
    // Khởi tạo các groups
    amenityGroups.forEach(group => {
      if (group && group.AmenityGroupID) {
        groupedAmenities[group.AmenityGroupID] = {
          ...group,
          amenities: []
        };
      }
    });
    
    // Map amenities vào groups tương ứng
    amenities.forEach(amenity => {
      if (amenity && amenity.AmenityGroupID && groupedAmenities[amenity.AmenityGroupID]) {
        groupedAmenities[amenity.AmenityGroupID].amenities.push(amenity);
      }
    });
    
    return Object.values(groupedAmenities);
  };

  const handleAmenityChange = (amenityId) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const toggleAmenityGroup = (groupId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleImageUpload = (groupIndex, e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Lưu cả file thực tế và tên file
      const imageNames = files.map(file => file.name);
      setFormData(prev => ({
        ...prev,
        imageGroups: prev.imageGroups.map((group, index) => 
          index === groupIndex 
            ? { 
                ...group, 
                images: [...group.images, ...imageNames],
                files: [...(group.files || []), ...files]
              }
            : group
        )
      }));
    }
  };

  const handleImageGroupTitleChange = (groupIndex, title) => {
    setFormData(prev => ({
      ...prev,
      imageGroups: prev.imageGroups.map((group, index) => 
        index === groupIndex ? { ...group, title } : group
      )
    }));
  };

  const addImageGroup = () => {
    setFormData(prev => ({
      ...prev,
      imageGroups: [...prev.imageGroups, { title: '', images: [], files: [], hasExistingImages: false }]
    }));
  };

  // Upload tất cả ảnh cho sản phẩm (tất cả đều phải có title - room tour)
  const uploadAllProductImages = async (productId, imageGroups) => {
    // Chỉ lấy groups có title và có files
    const validGroups = imageGroups.filter(group => 
      group.title && group.title.trim() && group.files && group.files.length > 0
    );

    if (validGroups.length === 0) {
      return { success: true, message: 'No images to upload' };
    }

    // Gom tất cả files và tạo roomTourData
    const allFiles = [];
    const roomTourData = [];
    let fileIndex = 0;

    validGroups.forEach(group => {
      const fileIndices = [];
      
      group.files.forEach(() => {
        fileIndices.push(fileIndex);
        fileIndex++;
      });
      
      roomTourData.push({
        title: group.title.trim(),
        fileIndices: fileIndices
      });
      
      allFiles.push(...group.files);
    });

    const formData = new FormData();
    formData.append('ProductID', productId);
    formData.append('Source', 'bidstay');
    formData.append('roomTourData', JSON.stringify(roomTourData));
    
    allFiles.forEach(file => {
      formData.append('images', file);
    });

    productApi.uploadImage(formData);
  };

  const removeImage = async (groupIndex, imageIndex) => {
    if (deletingImage) return; // Prevent multiple clicks
    
    const group = formData.imageGroups[groupIndex];
    const image = group.images[imageIndex];
    
    // Nếu đang ở chế độ edit/view và có ảnh existing
    if ((type === 'edit' || type === 'view') && group.hasExistingImages && group.imageIds && group.imageIds[imageIndex]) {
      setDeletingImage(true);
      try {
        const imageId = group.imageIds[imageIndex];
        await productApi.removeImage(formData.uid, imageId);
        console.log('Image removed from server:', imageId);
      } catch (error) {
        console.error('Error removing image from server:', error);
        alert('Có lỗi khi xóa ảnh từ server: ' + error.message);
        setDeletingImage(false);
        return; // Không xóa khỏi UI nếu lỗi API
      } finally {
        setDeletingImage(false);
      }
    }

    // Xóa khỏi UI
    setFormData(prev => ({
      ...prev,
      imageGroups: prev.imageGroups.map((group, index) => 
        index === groupIndex 
          ? { 
              ...group, 
              images: group.images.filter((_, i) => i !== imageIndex),
              files: (group.files || []).filter((_, i) => i !== imageIndex),
              imageIds: (group.imageIds || []).filter((_, i) => i !== imageIndex)
            }
          : group
      )
    }));
  };

  const removeImageGroup = async (groupIndex) => {
    if (formData.imageGroups.length > 1) {
      if (deletingRoomTour) return; // Prevent multiple clicks
      
      const group = formData.imageGroups[groupIndex];
      
      // Nếu đang ở chế độ edit/view và có title để xóa room tour
      if ((type === 'edit' || type === 'view') && group.title && group.title.trim()) {
        setDeletingRoomTour(true);
        try {
          await productApi.removeRoomTour(formData.uid, { title: group.title.trim() });
          console.log('Room tour removed from server:', group.title);
        } catch (error) {
          console.error('Error removing room tour from server:', error);
          alert('Có lỗi khi xóa danh mục ảnh từ server: ' + error.message);
          setDeletingRoomTour(false);
          return; // Không xóa khỏi UI nếu lỗi API
        } finally {
          setDeletingRoomTour(false);
        }
      }

      // Xóa khỏi UI
      setFormData(prev => ({
        ...prev,
        imageGroups: prev.imageGroups.filter((_, index) => index !== groupIndex)
      }));
    }
  };

  // Lấy tên province, district từ code đã chọn
  const getProvinceName = (code) => provinces.find(p => p.code === code)?.Name || '';
  const getDistrictName = (code) => districts.find(d => d.code === code)?.Name || '';

  // Build full address cho geocode
  const buildFullAddress = () => {    
    const parts = [
      formData.address?.trim(),
      getDistrictName(formData.districtCode),
      getProvinceName(formData.provinceCode),
      'Việt Nam'
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Debounce geocode khi người dùng gõ địa chỉ / chọn tỉnh / quận
  const geocodeNow = async () => {
    const q = buildFullAddress();
    if (!q) return;
    setGeocoding(true);
    setGeocodeError('');
    const geo = await LocationAPI.geocodeAddress(q);
    if (geo) {
      // Cập nhật formData với lat/lng mới
      setFormData(prev => ({
        ...prev,
        latitude: geo.lat,
        longitude: geo.lng
      }));
    }
    setGeocoding(false);
  };

  // Trigger khi đổi address/province/district
  useEffect(() => {
    if ((type === 'add' || type === 'edit') && formData.address && formData.provinceCode && formData.districtCode) {
      // Tạo debounce function mới cho mỗi lần thay đổi
      const debouncedGeocode = debounce(geocodeNow, 800);
      debouncedGeocode();
    }
  }, [formData.address, formData.provinceCode, formData.districtCode, provinces, districts]);


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

    if (!formData.propertyType) {
      alert('Vui lòng chọn hình thức chỗ ở');
      return;
    }

    if (!formData.price) {
      alert('Vui lòng nhập giá phòng');
      return;
    }

    if (!formData.descriptions[0].htmlText.trim()) {
      alert('Vui lòng nhập mô tả');
      return;
    }

    if (!formData.provinceCode) {
      alert('Vui lòng chọn tỉnh');
      return;
    }

    if (!formData.districtCode) {
      alert('Vui lòng chọn thành phố/quận/huyện');
      return;
    }

    if (!formData.address.trim()) {
      alert('Vui lòng nhập địa chỉ');
      return;
    }

    // Validation cho ảnh - tất cả ảnh phải có title
    const hasImages = formData.imageGroups.some(group => 
      group.files && group.files.length > 0
    );
    
    if (hasImages) {
      const groupsWithImages = formData.imageGroups.filter(group => 
        group.files && group.files.length > 0
      );
      
      const groupsWithoutTitle = groupsWithImages.filter(group => 
        !group.title || !group.title.trim()
      );
      
      if (groupsWithoutTitle.length > 0) {
        alert('Tất cả danh mục có ảnh phải có tên danh mục. Vui lòng điền tên cho tất cả danh mục.');
        return;
      }
    }

    if (type === 'add') {
      await handleAdd();
    } else if (type === 'edit') {
      await handleUpdate();
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    try {
      // Prepare data for API
      const productDataToSubmit = {
        name: formData.name.trim(),
        roomType: formData.roomType,
        propertyType: formData.propertyType,
        bedrooms: formData.bedrooms,
        beds: formData.beds,
        bathrooms: formData.bathrooms,
        maxGuests: formData.maxGuests,
        price: formData.price,
        descriptions: formData.descriptions.filter(desc => desc.htmlText.trim()),
        provinceCode: formData.provinceCode,
        districtCode: formData.districtCode,
        address: formData.address.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        amenities: formData.amenities,
        houseRules: formData.houseRules.filter(rule => rule.trim()),
        safetyProperties: formData.safetyProperties.filter(prop => prop.trim()),
        imageGroups: formData.imageGroups.filter(group => group.title.trim() || group.images.length > 0)
      };

      console.log('Product data to submit:', productDataToSubmit);

      // Bước 1: Tạo sản phẩm trước
      const createResponse = await productApi.addProduct(productDataToSubmit);
      console.log('Product created:', createResponse);
      
      // Lấy ProductID từ response
      const productId = createResponse.data; // ProductModel.addProduct trả về productId số, controller wrap trong data
      
      if (!productId) {
        console.error('Full response:', createResponse);
        throw new Error('Không thể lấy ProductID từ response');
      }

      // Bước 2: Upload ảnh nếu có
      const hasImages = formData.imageGroups.some(group => 
        group.files && group.files.length > 0
      );

      if (hasImages) {
        setUploadingImages(true);
        try {
          console.log('Uploading images for product:', productId);
          const uploadResult = await uploadAllProductImages(productId, formData.imageGroups);
          console.log('Upload result:', uploadResult);
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          // Không throw error ở đây vì sản phẩm đã được tạo thành công
          alert('Sản phẩm đã được tạo nhưng có lỗi khi upload ảnh: ' + imageError.message);
        } finally {
          setUploadingImages(false);
        }
      }

      alert('Tạo sản phẩm thành công!');
      navigate('/admin/products-management');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Có lỗi xảy ra khi tạo sản phẩm: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      // Prepare data for API
      const productDataToSubmit = {
        name: formData.name.trim(),
        roomType: formData.roomType,
        propertyType: formData.propertyType,
        bedrooms: formData.bedrooms,
        beds: formData.beds,
        bathrooms: formData.bathrooms,
        maxGuests: formData.maxGuests,
        price: formData.price,
        descriptions: formData.descriptions.filter(desc => desc.htmlText.trim()),
        provinceCode: formData.provinceCode,
        districtCode: formData.districtCode,
        address: formData.address.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        amenities: formData.amenities,
        houseRules: formData.houseRules.filter(rule => rule.trim()),
        safetyProperties: formData.safetyProperties.filter(prop => prop.trim()),
        imageGroups: formData.imageGroups.filter(group => group.title.trim() || group.images.length > 0)
      };

      console.log('🔍 Updating with UID:', formData.uid);
      console.log('🔍 Amenities:', formData.amenities);


      // Call update API (productId, productData)
      const updateResponse = await productApi.updateProduct(formData.uid, productDataToSubmit);
      console.log('Product updated:', updateResponse);

      // Handle image uploads if there are new images
      const hasNewImages = formData.imageGroups.some(group => 
        group.files && group.files.length > 0
      );

      if (hasNewImages) {
        setUploadingImages(true);
        try {
          // Nếu user chọn thay thế ảnh, xóa tất cả ảnh cũ trước
          // if (replaceImages) {
          //   console.log('Deleting old images...');
          //   await productApi.deleteProductImages(formData.uid);
          // }
          
          // Upload ảnh mới
          console.log('Uploading new images...');
          const uploadResult = await uploadAllProductImages(formData.productId, formData.imageGroups);
          console.log('Upload result:', uploadResult);
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          alert('Sản phẩm đã được cập nhật nhưng có lỗi khi xử lý ảnh: ' + imageError.message);
        } finally {
          setUploadingImages(false);
        }
      }

      alert('Cập nhật sản phẩm thành công!');
      navigate('/admin/products-management');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Có lỗi xảy ra khi cập nhật sản phẩm: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    let confirmMessage;
    if (type === 'add') {
      confirmMessage = 'Bạn có chắc muốn hủy? Dữ liệu đã nhập sẽ bị mất.';
      if (window.confirm(confirmMessage)) {
        navigate('/admin/products-management');
      }
    } else if (type === 'edit') {
      confirmMessage = 'Bạn có chắc muốn hủy? Các thay đổi sẽ không được lưu.';
      if (window.confirm(confirmMessage)) {
        navigate('/admin/products-management');
      }
    }
    else navigate('/admin/products-management');
  };

  // Get page title based on type
  const getPageTitle = () => {
    switch (type) {
      case 'view':
        return 'Xem chi tiết sản phẩm';
      case 'edit':
        return 'Chỉnh sửa sản phẩm';
      default:
        return 'Thêm sản phẩm mới';
    }
  };

  // Get breadcrumbs based on type
  const getBreadcrumbs = () => {
    const baseCrumbs = [
      { label: 'Dashboard', to: '/admin/dashboard' },
      { label: 'Quản lý sản phẩm', to: '/admin/products-management' }
    ];
    
    switch (type) {
      case 'view':
        return [...baseCrumbs, { label: 'Xem chi tiết sản phẩm' }];
      case 'edit':
        return [...baseCrumbs, { label: 'Chỉnh sửa sản phẩm' }];
      default:
        return [...baseCrumbs, { label: 'Thêm sản phẩm mới' }];
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title={getPageTitle()}
        crumbs={getBreadcrumbs()}
      />

      {(type === 'view' || type === 'edit') && !product ? (
        <div className={styles.layout}>
          <main className={styles.main}>
            <div className={styles.loading}>Đang tải dữ liệu sản phẩm...</div>
          </main>
        </div>
      ) : (
        <div className={styles.layout}>
          <main className={styles.main}>
            <div className={styles.formContainer}>
              <form onSubmit={handleSubmit} className={styles.form}>
              
              {/* Basic Information */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Thông tin cơ bản</h3>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Tên sản phẩm {type !== 'view' && <span className={styles.required}>*</span>}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Nhập tên phòng/nhà/căn hộ"
                    required={type !== 'view'}
                    disabled={isDisabled}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Loại chỗ ở {type !== 'view' && <span className={styles.required}>*</span>}
                    </label>
                    <select
                      name="roomType"
                      value={formData.roomType}
                      onChange={handleInputChange}
                      className={styles.select}
                      required={type !== 'view'}
                      disabled={isDisabled || loadingRoomTypes}
                    >
                      <option value="">
                        {loadingRoomTypes 
                          ? 'Đang tải...' 
                          : 'Chọn loại chỗ ở'
                        }
                      </option>
                      {Array.isArray(roomTypes) && roomTypes.map(roomType => (
                        roomType && roomType.RoomTypeID && (
                          <option key={roomType.RoomTypeID} value={roomType.RoomTypeID}>
                            {roomType.RoomTypeName || ''}
                          </option>
                        )
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Hình thức chỗ ở {type !== 'view' && <span className={styles.required}>*</span>}
                    </label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className={styles.select}
                      required={type !== 'view'}
                      disabled={isDisabled || loadingPropertyTypes}
                    >
                      <option value="">
                        {loadingPropertyTypes 
                          ? 'Đang tải...' 
                          : 'Chọn loại hình thức chỗ ở'
                        }
                      </option>
                      {Array.isArray(propertyTypes) && propertyTypes.map(propertyType => (
                        propertyType && propertyType.PropertyID && (
                          <option key={propertyType.PropertyID} value={propertyType.PropertyID}>
                            {propertyType.PropertyName || ''}
                          </option>
                        )
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số phòng ngủ</label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      onWheel={preventNumberScroll}
                      className={styles.input}
                      placeholder="Nhập số phòng ngủ"
                      min={1}
                      required={type !== 'view'}
                      disabled={isDisabled}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số giường ngủ</label>
                    <input
                      type="number"
                      name="beds"
                      value={formData.beds}
                      onChange={handleInputChange}
                      onWheel={preventNumberScroll}
                      className={styles.input}
                      placeholder="Nhập số giường ngủ"
                      min={1}
                      required={type !== 'view'}
                      disabled={isDisabled}
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
                      onWheel={preventNumberScroll}
                      className={styles.input}
                      placeholder="Nhập số phòng tắm"
                      min={1}
                      required={type !== 'view'}
                      disabled={isDisabled}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số khách tối đa</label>
                    <input
                      type="number"
                      name="maxGuests"
                      value={formData.maxGuests}
                      onChange={handleInputChange}
                      onWheel={preventNumberScroll}
                      className={styles.input}
                      placeholder="Nhập số khách tối đa"
                      min={1}
                      required={type !== 'view'}
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Giá phòng (VND) {type !== 'view' && <span className={styles.required}>*</span>}
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    onWheel={preventNumberScroll}
                    className={styles.input}
                    placeholder="Nhập giá phòng"
                    min={0}
                    required={type !== 'view'}
                    disabled={isDisabled}
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
                          Mô tả chính {type !== 'view' && <span className={styles.required}>*</span>}
                        </label>
                        <textarea
                          value={description.htmlText}
                          onChange={(e) => handleDescriptionChange(index, 'htmlText', e.target.value)}
                          className={styles.textarea}
                          placeholder="Nhập mô tả chi tiết về sản phẩm..."
                          rows={4}
                          required={type !== 'view'}
                          disabled={isDisabled}
                        />
                      </div>
                    ) : (
                      <div className={styles.formGroup}>
                        <div className={styles.descriptionHeader}>
                          <label className={styles.label}>Mô tả #{index + 1}</label>
                          {!isDisabled && (
                            <button
                              type="button"
                              onClick={() => removeDescription(index)}
                              className={styles.removeDescBtn}
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={description.title}
                          onChange={(e) => handleDescriptionChange(index, 'title', e.target.value)}
                          className={styles.input}
                          placeholder="Nhập tiêu đề mô tả..."
                          style={{ marginBottom: '8px' }}
                          disabled={isDisabled}
                        />
                        <textarea
                          value={description.htmlText}
                          onChange={(e) => handleDescriptionChange(index, 'htmlText', e.target.value)}
                          className={styles.textarea}
                          placeholder="Nhập nội dung mô tả..."
                          rows={3}
                          disabled={isDisabled}
                        />
                      </div>
                    )}
                  </div>
                ))}
                {!isDisabled && (
                  <button
                    type="button"
                    onClick={addDescription}
                    className={styles.addDescBtn}
                  >
                    <span>+ </span>
                    <span style={{ textDecoration: 'underline' }}>Thêm mô tả</span>
                  </button>
                )}
              </div>

              {/* Location Information */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Thông tin vị trí</h3>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Địa chỉ {type !== 'view' && <span className={styles.required}>*</span>}
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Nhập địa chỉ"
                    required={type !== 'view'}
                    disabled={isDisabled}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Tỉnh {type !== 'view' && <span className={styles.required}>*</span>}
                    </label>
                    <select
                      name="provinceCode"
                      value={formData.provinceCode}
                      onChange={handleInputChange}
                      className={styles.select}
                      required={type !== 'view'}
                      disabled={isDisabled || loadingProvinces}
                    >
                      <option value="">
                        {loadingProvinces 
                          ? 'Đang tải...' 
                          : 'Chọn tỉnh/thành phố'
                        }
                      </option>
                      {Array.isArray(provinces) && provinces.map(province => (
                        province && province.code && (
                          <option key={province.code} value={province.code}>
                            {province.Name || province.name || ''}
                          </option>
                        )
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Thành phố/Quận/Huyện {type !== 'view' && <span className={styles.required}>*</span>}
                    </label>
                    <select
                      name="districtCode"
                      value={formData.districtCode}
                      onChange={handleInputChange}
                      className={styles.select}
                      required={type !== 'view'}
                      disabled={isDisabled || !formData.provinceCode || loadingDistricts}
                    >
                      <option value="">
                        {!formData.provinceCode 
                          ? 'Chọn tỉnh/thành phố trước'
                          : loadingDistricts 
                          ? 'Đang tải...'
                          : 'Chọn quận/huyện'
                        }
                      </option>
                      {Array.isArray(filteredDistricts) && filteredDistricts.map(district => (
                        district && district.code && (
                          <option key={district.code} value={district.code}>
                            {district.Name || district.name || ''}
                          </option>
                        )
                      ))}
                    </select>
                  </div>
                </div>

                {/* Hiển thị map dựa trên địa chỉ đã nhập -> latitude, longitude với mapboxgl */}
                {(formData.provinceCode && formData.districtCode && formData.address) && (
                  <div className={styles.mapContainer}>
                    <Location
                      lat={formData.latitude}
                      lng={formData.longitude}
                      label={''}
                    />
                  </div>
                )}
              </div>

              {/* Amenities */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Tiện nghi</h3>
                {loadingAmenityGroups || loadingAmenities ? (
                  <p>Đang tải tiện nghi...</p>
                ) : amenityGroups.length === 0 && amenities.length === 0 ? (
                  <p className={styles.noDataMessage}>Không có dữ liệu tiện nghi. Vui lòng kiểm tra kết nối cơ sở dữ liệu.</p>
                ) : (
                  getAmenitiesByGroup().map(group => (
                    group && group.amenities && group.amenities.length > 0 && (
                      <div key={group.AmenityGroupID} className={styles.amenityGroup}>
                        <div 
                          className={styles.amenityGroupHeader}
                          onClick={() => toggleAmenityGroup(group.AmenityGroupID)}
                        >
                          <label className={styles.label}>{group.AmenityGroupName || 'Nhóm tiện nghi'}</label>
                          <img
                            src={collapsedGroups[group.AmenityGroupID] ? ChevronDownIcon : ChevronUpIcon}
                            alt={collapsedGroups[group.AmenityGroupID] ? 'Expand' : 'Collapse'}
                            className={styles.chevronIcon}
                          />
                        </div>
                        {!collapsedGroups[group.AmenityGroupID] && (
                          <div className={styles.amenitiesGrid}>
                            {group.amenities.map(amenity => (
                              amenity && amenity.AmenityID && (
                                <label key={amenity.AmenityID} className={styles.checkboxLabel}>
                                  <input
                                    type="checkbox"
                                    checked={formData.amenities.includes(amenity.AmenityID)}
                                    onChange={() => handleAmenityChange(amenity.AmenityID)}
                                    className={styles.checkbox}
                                    disabled={isDisabled}
                                  />
                                  <span className={styles.checkboxText}>{amenity.AmenityName || 'Tiện nghi'}</span>
                                </label>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  ))
                )}
              </div>

              {/* Policies */}
              <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Chính sách</h3>
                  
                  <div className={styles.formGroup}>
                  <div className={styles.policySection}>
                    <label className={styles.label}>Nội quy nhà</label>
                    {formData.houseRules.map((rule, index) => (
                      <div key={index} className={styles.policyItem}>
                        <input
                          type="text"
                          value={rule}
                          onChange={(e) => handlePolicyChange('houseRules', index, e.target.value)}
                          className={styles.policyInput}
                          placeholder="Nhập nội quy nhà..."
                          disabled={isDisabled}
                        />
                        {!isDisabled && formData.houseRules.length > 1 && index !== 0 && (
                          <button
                            type="button"
                            onClick={() => removePolicy('houseRules', index)}
                            className={styles.policyClearBtn}
                            aria-label="Xoá nội quy"
                          />
                        )}
                      </div>
                    ))}

                    {!isDisabled && (
                      <button
                        type="button"
                        onClick={() => addPolicy('houseRules')}
                        className={styles.addPolicyBtn}
                      >
                        <span>+ </span>
                        <span style={{ textDecoration: 'underline' }}>Thêm nội quy nhà</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.policySection}>
                  <label className={styles.label}>An toàn và chỗ ở</label>
                  {formData.safetyProperties.map((property, index) => (
                    <div key={index} className={styles.policyItem}>
                      <input
                        type="text"
                        value={property}
                        onChange={(e) => handlePolicyChange('safetyProperties', index, e.target.value)}
                        className={styles.policyInput}
                        placeholder="Nhập chính sách an toàn..."
                        disabled={isDisabled}
                      />
                      {formData.safetyProperties.length > 1 && index !== 0 && (
                        <button
                          type="button"
                          onClick={() => removePolicy('safetyProperties', index)}
                          className={styles.policyClearBtn}
                          aria-label="Xoá chính sách"
                        />
                      )}
                    </div>
                  ))}

                  {!isDisabled && (
                    <button
                      type="button"
                      onClick={() => addPolicy('safetyProperties')}
                      className={styles.addPolicyBtn}
                    >
                      <span>+ </span>
                      <span style={{ textDecoration: 'underline' }}>Thêm chính sách an toàn</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Images */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Hình ảnh</h3>                
                {formData.imageGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className={styles.imageGroupContainer}>
                    <div className={styles.imageGroupHeader}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>
                          {groupIndex === 0 ? 'Tên danh mục hình ảnh' : `Tên danh mục #${groupIndex + 1}`}
                        </label>
                        <input
                          type="text"
                          value={group.title}
                          onChange={(e) => handleImageGroupTitleChange(groupIndex, e.target.value)}
                          className={styles.input}
                          placeholder="Nhập tên danh mục (VD: Phòng khách, Phòng ngủ, Nhà bếp...)"
                          disabled={isDisabled}
                        />
                      </div>
                      {!isDisabled && formData.imageGroups.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageGroup(groupIndex)}
                          className={styles.removeGroupBtn}
                          aria-label="Xóa danh mục"
                          disabled={deletingRoomTour}
                          title={deletingRoomTour ? "Đang xóa..." : "Xóa danh mục này"}
                        >
                          {deletingRoomTour ? "..." : "×"}
                        </button>
                      )}
                    </div>

                    {!isDisabled && (
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Upload hình ảnh cho danh mục này</label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleImageUpload(groupIndex, e)}
                          className={styles.fileInput}
                        />
                        <p className={styles.helpText}>
                          Chọn nhiều hình ảnh cùng lúc. Hỗ trợ JPG, PNG, GIF.
                        </p>
                      </div>
                    )}

                    {(group.images && group.images.length > 0) ? (
                      <div className={styles.imagePreview}>
                        <h4>Hình ảnh đã chọn</h4>
                        <div className={styles.imageList}>
                          {group.images.map((image, imageIndex) => (
                            image && (
                              <div key={imageIndex} className={styles.imageItem}>
                                {(type === 'view' || type === 'edit') && group.hasExistingImages ? (
                                  <img
                                    src={image}
                                    alt={`Image ${imageIndex}`}
                                    className={styles.previewImg}
                                    onError={(e) => {
                                      e.target.src = '';
                                      e.target.alt = 'Không thể tải ảnh';
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className={styles.imageNameContainer}>
                                    <span className={styles.imageName}>{image || 'Không có tên ảnh'}</span>
                                  </div>
                                )}
                                {!isDisabled && (
                                  <button
                                    type="button"
                                    onClick={() => removeImage(groupIndex, imageIndex)}
                                    className={styles.removeImageBtn}
                                    title={deletingImage ? "Đang xóa..." : "Xóa ảnh này"}
                                    disabled={deletingImage}
                                  >
                                    {deletingImage ? "..." : "×"}
                                  </button>
                                )}
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className={styles.noImagesMessage}>Chưa có ảnh nào được chọn</p>
                    )}
                  </div>
                ))}

                {!isDisabled && (
                  <button
                    type="button"
                    onClick={addImageGroup}
                    className={styles.addGroupBtn}
                  >
                    <span>+ </span>
                    <span style={{ textDecoration: 'underline' }}>Thêm danh mục</span>
                  </button>
                )}
              </div>

              {/* Submit Buttons */}
              <div className={styles.actionButtons}>
                <button
                  type="button"
                  onClick={handleCancel}
                  className={styles.cancelBtn}
                  disabled={loading || uploadingImages || updating}
                >
                  {type === 'view' ? 'Đóng' : 'Hủy'}
                </button>
                
                {type === 'add' && (
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading || uploadingImages}
                  >
                    {loading 
                      ? 'Đang tạo sản phẩm...' 
                      : uploadingImages 
                      ? 'Đang upload ảnh...' 
                      : 'Tạo sản phẩm'
                    }
                  </button>
                )}
                
                {type === 'edit' && (
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={!hasChanges || loading || uploadingImages || updating}
                  >
                    {updating 
                      ? 'Đang cập nhật...' 
                      : uploadingImages 
                      ? 'Đang upload ảnh...'
                      : 'Cập nhật sản phẩm'
                    }
                  </button>
                )}
              </div>
            </form>
          </div>
        </main>
      </div>
      )}
    </div>
  );
};

export default AdminAddProductPage;
